# How to Publish the Docker Image

This guide is for the developer (you) to build and publish the Docker image to Docker Hub.

## Prerequisites

1.  Create a strict [Docker Hub](https://hub.docker.com/) account if you haven't already.
2.  Install Docker Desktop on your machine.
3.  Login to Docker from your terminal:
    ```bash
    docker login
    ```

## 1. Build and Tag

Run this command from the root of the project (where you can access the `client` folder). Replace `yourusername` with your actual Docker Hub username.

```bash
# Navigate to client directory
cd client

# Build and tag the image
# Format: docker build -t <username>/<repo-name>:<version> .
docker build -t blackdevil0070/swipeit:latest .
```

## 2. Test Locally (Optional)

Before pushing, it's good to verify it works:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_IMMICH_SERVER_URL="https://demo.immich.app" \
  blackdevil0070/swipeit:latest
```

## 3. Push to Docker Hub

```bash
docker push blackdevil0070/swipeit:latest
```

Once this finishes, your image will be publicly available at `https://hub.docker.com/r/blackdevil0070/swipeit`.

## 4. Multi-Platform Support (Advanced)

If you want your image to run on both Intel/AMD chips (most servers) and Apple Silicon/Raspberry Pi (ARM), use `docker buildx`.

```bash
# Initialize buildx (only need to do this once)
docker buildx create --use

# Build and push for both platforms
docker buildx build --platform linux/amd64,linux/arm64 \
  -t blackdevil0070/swipeit:latest \
  --push .
```
