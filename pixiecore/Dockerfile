FROM golang
RUN go get -ldflags "-linkmode external -extldflags -static" -a go.universe.tf/netboot/cmd/pixiecore

FROM alpine
COPY --from=0 /go/bin/pixiecore /bin
CMD /bin/pixiecore api http://server:1234/pixiecore
