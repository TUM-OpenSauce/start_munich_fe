#!/bin/bash

# loading .env file
set -o allexport
source .env
set +o allexport

# login into docker hub
echo "Logging in to Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker compose build --no-cache

echo "Pushing $IMAGE to Docker Hub..."
docker push "$DOCKER_USERNAME/$DOCKER_IMAGE_NAME:$DOCKER_IMAGE_VERSION"
echo "Docker image pushed to: $DOCKER_USERNAME/$DOCKER_IMAGE_NAME:$DOCKER_IMAGE_VERSION"