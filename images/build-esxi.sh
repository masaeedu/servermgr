#!/usr/bin/env bash

# Example usage:
# ./build-esxi.sh 192.168.10.214 ks.cfg ./esxi5.iso ./esxi5-auto.iso

set -e

IP=$1
KS_SCRIPT=$2
INPUT_ISO=$3
OUTPUT_ISO=$4

WORKDIR=$(mktemp -d)
URL=http://$IP:8080/$KS_SCRIPT
MOUNTPOINT=/mnt/$(basename $(mktemp -u) | cut -d '.' -f2)

# Extract
mkdir -p $MOUNTPOINT
mount -o loop $INPUT_ISO $MOUNTPOINT
rsync -avz $MOUNTPOINT/ $WORKDIR
umount $MOUNTPOINT
rm -rf $MOUNTPOINT

# Customize
sed -i "s#kernelopt=runweasel#kernelopt=runweasel ks=$URL#" $WORKDIR/boot.cfg

# Repack
#genisoimage -relaxed-filenames -J -R -o $OUTPUT_ISO -b isolinux.bin -c boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -eltorito-alt-boot -e efiboot.img -no-emul-boot $WORKDIR
mkisofs -relaxed-filenames -J -R -o $OUTPUT_ISO -b isolinux.bin -c boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table $WORKDIR
