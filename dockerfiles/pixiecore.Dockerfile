FROM alpine
RUN apk update && apk upgrade

# Install tools for runtime builds
RUN apk add bash binutils build-base gcc git make mtools perl xz xz-dev

# Install golang
RUN apk add go
ENV PATH="/root/go/bin:${PATH}"
RUN go get -u github.com/jteeuwen/go-bindata/...

COPY ./vendor/netboot /usr/lib/go/src/github.com/masaeedu/netboot
WORKDIR /usr/lib/go/src/github.com/masaeedu/netboot

# Build go-embedded data
RUN cd third_party && make

# Build pixiecore
RUN cd cmd/pixiecore && go get ./... && go build -v && go install -v

# Ready to start
CMD /usr/lib/go/bin/pixiecore api http://localhost:1234/pixiecore
