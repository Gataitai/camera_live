import io

from picamera2 import PiCamera
from fastapi import FastAPI
from fastapi.responses import Response

app = FastAPI()

@app.get("/image")
def get_image():
    picam2 = PiCamera2()
    capture_config = picam2.create_still_configuration(main={"size": (640, 480)})
    picam2.capture_config(capture_config)
    data = io.BytesIO()
    picam2.start()
    picam2.capture_file(data, format="jpeg")
    picam2.stop()
    picam2.close()
    return Response(content=data.getvalue(), media_type="image/jpeg")