image=servermgr-client
container=$image

docker rm -f $container
docker run -i -p 3000:3000 --network="host" -h $container --name $container -d $image
#docker run -ti -p 3000:3000 -h $container --name $container --entrypoint=/bin/bash -d $image -i
