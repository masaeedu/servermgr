FROM gentoo/stage3-amd64

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

# Install go
RUN mkdir /etc/portage/package.accept_keywords/
RUN echo dev-lang/go >> /etc/portage/package.accept_keywords/go
RUN FEATURES='-usersandbox' emerge dev-lang/go

# Install pixiecore
RUN go get go.universe.tf/netboot/cmd/pixiecore

# Create entrypoint script
RUN echo -e "#!/bin/bash\nexec /root/go/bin/pixiecore api http://localhost:1234/pixiecore" > /sbin/entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /sbin/entrypoint.sh

ENTRYPOINT ["/bin/bash"]

CMD ["/sbin/entrypoint.sh"]
