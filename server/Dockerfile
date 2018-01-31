FROM gentoo/stage3-amd64

EXPOSE 1234

# Set the time zone to EST
RUN rm /etc/localtime
RUN ln -s /usr/share/zoneinfo/America/Toronto /etc/localtime

# Download and extract latest portage
RUN wget http://distfiles.gentoo.org/snapshots/portage-latest.tar.bz2 && \
    wget http://distfiles.gentoo.org/snapshots/portage-latest.tar.bz2.md5sum && \
    md5sum -c portage-latest.tar.bz2.md5sum 
RUN tar -xjvf portage-latest.tar.bz2 -C /usr

# Update system
RUN emerge --sync
RUN emerge -DuN world

# Install git
RUN emerge dev-vcs/git

# Install nodejs
RUN mkdir /etc/portage/package.accept_keywords/
RUN echo net-libs/http-parser >> /etc/portage/package.accept_keywords/node
RUN echo dev-libs/libuv >> /etc/portage/package.accept_keywords/node
RUN echo net-libs/nghttp2 >> /etc/portage/package.accept_keywords/node
RUN echo dev-libs/openssl >> /etc/portage/package.accept_keywords/node
RUN echo net-libs/nodejs >> /etc/portage/package.accept_keywords/node
RUN emerge net-libs/nodejs

# install dependencies
RUN echo sys-apps/ipmiutil >> /etc/portage/package.accept_keywords/ipmi
RUN echo sys-apps/ipmitool >> /etc/portage/package.accept_keywords/ipmi
RUN emerge sys-apps/ipmiutil sys-apps/ipmitool

# Install yarn
RUN echo sys-apps/yarn >> /etc/portage/package.accept_keywords/node
RUN emerge sys-apps/yarn

# Clone app folder
RUN git clone https://github.com/masaeedu/servermgr.git /app

# Clone ipxe
RUN git clone git://git.ipxe.org/ipxe.git /app/ipxe

# Setup app
COPY src/index.js /app/server/src/index.js
COPY config/credentials.json /app/server/config/credentials.json
COPY config/mapping.json /app/server/config/mapping.json
COPY config/images/*.iso /app/server/config/images/

# Install dependencies
RUN cd /app/server && yarn

# Create entrypoint script
RUN echo -e "#!//usr/bin/env bash\ncd /app/server && yarn start" > /sbin/entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /sbin/entrypoint.sh

ENTRYPOINT ["/sbin/entrypoint.sh"]
