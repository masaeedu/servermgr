# Obtain ipmiutil via nix
FROM nixos/nix
RUN nix-channel --add https://nixos.org/channels/nixpkgs-unstable nixpkgs
RUN nix-channel --update
RUN nix-env -iA nixpkgs.ipmiutil

FROM alpine
RUN apk update && apk upgrade

# Install server-specific tools
RUN apk add ipmitool nodejs
RUN npm i -g yarn

# Add ipmiutil from nix image
COPY --from=0 /nix /nix
ENV PATH="/nix/var/nix/profiles/default/bin:/nix/var/nix/profiles/default/sbin:${PATH}"

# Add and build code
COPY ./server /app
WORKDIR /app
RUN yarn

# Ready to start
VOLUME ["/config", "/images"]
CMD yarn start
EXPOSE 1234
