import io
import time
from threading import Condition

from picamera2 import Picamera2
from picamera2.encoders import MJPEGEncoder
from picamera2.outputs import FileOutput
from fastapi import FastAPI
from fastapi.responses import Response, StreamingResponse
from starlette.background import BackgroundTask

app = FastAPI()

class StreamingOutput:
    def __init__(self):
        self.frame = None
        self.buffer = io.BytesIO()
        self.condition = Condition()

    def write(self, buf):
        if buf.startswith(b'\xff\xd8'):
            # New frame, copy the existing buffer's content and notify all clients
            self.buffer.truncate()
            with self.condition:
                self.frame = self.buffer.getvalue()
                self.condition.notify_all()
            self.buffer.seek(0)
        return self.buffer.write(buf)

def generate_frames(output):
    while True:
        with output.condition:
            output.condition.wait()
            frame = output.frame
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.get("/image")
def get_image():
    picam2 = Picamera2()
    capture_config = picam2.create_still_configuration(main={"size": (640, 480)})
    picam2.configure(capture_config)
    picam2.start()
    time.sleep(0.5)  # Allow camera to stabilize
    data = io.BytesIO()
    picam2.capture_file(data, format="jpeg")
    picam2.stop()
    picam2.close()
    data.seek(0)
    return Response(content=data.getvalue(), media_type="image/jpeg")

@app.get("/mjpeg")
async def mjpeg():
    picam2 = Picamera2()
    video_config = picam2.create_video_configuration(main={"size": (1280, 720)})
    picam2.configure(video_config)
    output = StreamingOutput()

    encoder = MJPEGEncoder()
    file_output = FileOutput(output)

    picam2.start()
    picam2.start_recording(encoder, file_output)

    def stop():
        print("Stopping recording")
        picam2.stop_recording()
        picam2.stop()
        picam2.close()

    return StreamingResponse(
        generate_frames(output),
        media_type="multipart/x-mixed-replace; boundary=frame",
        background=BackgroundTask(stop),
    )