<script>
    import { onMount } from 'svelte';

    let streamUrl = 'http://127.0.0.1:8000/mjpeg';
    let connected = false;
    let streamElement;

    // Function to check if stream is accessible
    function checkStreamConnection() {
        connected = !streamElement.complete || streamElement.naturalHeight !== 0;
        return connected;
    }

    onMount(() => {
        // Set up a timer to check stream connection
        const interval = setInterval(() => {
            if (streamElement) {
                checkStreamConnection();
            }
        }, 5000);

        return () => clearInterval(interval);
    });

    // Function to refresh the stream
    function refreshStream() {
        const currentSrc = streamElement.src;
        streamElement.src = '';
        setTimeout(() => {
            streamElement.src = currentSrc;
        }, 100);
    }
</script>

<main>
    <h1>Raspberry Pi Camera Stream</h1>

    <div class="stream-container">
        <img
                bind:this={streamElement}
                src={streamUrl}
                alt="MJPEG Stream"
                on:error={() => { connected = false; }}
                on:load={() => { connected = true; }}
        />

        {#if !connected}
            <div class="error-overlay">
                <p>Stream not available</p>
                <button on:click={refreshStream}>Refresh Stream</button>
            </div>
        {/if}
    </div>

    <div class="controls">
        <p>Stream status: <span class={connected ? 'connected' : 'disconnected'}>
            {connected ? 'Connected' : 'Disconnected'}
        </span></p>
        <button on:click={refreshStream}>Refresh</button>
    </div>

    <div class="info">
        <p>This stream is connecting to: {streamUrl}</p>
        <p>If you're using Cloudflared tunnel, replace the URL with your tunnel URL.</p>
    </div>
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    h1 {
        text-align: center;
        margin-bottom: 1rem;
    }

    .stream-container {
        position: relative;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        background: #f0f0f0;
        border-radius: 5px;
        overflow: hidden;
    }

    img {
        width: 100%;
        display: block;
    }

    .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.7);
        color: white;
    }

    .controls {
        margin-top: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    button {
        background: #4a6cf7;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background: #3a5ce7;
    }

    .connected {
        color: green;
        font-weight: bold;
    }

    .disconnected {
        color: red;
        font-weight: bold;
    }

    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f7f7f7;
        border-radius: 5px;
    }
</style>