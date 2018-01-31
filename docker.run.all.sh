pushd client && ./docker.container.run.sh
popd
pushd server && ./docker.container.run.sh
popd
pushd pixiecore && ./docker.container.run.sh
