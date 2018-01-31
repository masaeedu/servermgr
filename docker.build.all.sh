pushd client && ./docker.image.build.sh
popd
pushd server && ./docker.image.build.sh
popd
pushd pixiecore && ./docker.image.build.sh
