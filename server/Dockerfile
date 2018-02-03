# Obtain ipmiutil via nix
FROM nixos/nix
RUN nix-channel --add https://nixos.org/channels/nixpkgs-unstable nixpkgs
RUN nix-channel --update
RUN nix-env -iA nixpkgs.ipmiutil

# Prepare runtime image
FROM alpine
RUN apk update && apk upgrade
RUN apk add bash binutils build-base gcc git ipmitool make mtools nodejs perl xz xz-dev
RUN npm i -g yarn

# Add ipxe source code for runtime kernel prep
COPY ./ipxe /ipxe

# Add ipmiutil from nix image
COPY --from=0 /nix /nix
ENV PATH="/nix/var/nix/profiles/default/bin:/nix/var/nix/profiles/default/sbin:${PATH}"

# Add and build code
ADD . /app
WORKDIR /app
RUN yarn

# Ready to start
VOLUME ["/config", "/images"]
CMD yarn start
EXPOSE 1234
