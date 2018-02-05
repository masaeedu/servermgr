#!/usr/bin/env bash
set -e


WORKDIR=`mktemp -d`
HTTP_ADDRESS=http://192.168.10.229:8080/ks.cfg
INPUT_ISO=./esxi.iso
OUTPUT_ISO=./custom_esxi.iso
MOUNTPOINT=/mnt/iso

# Extract
mkdir -p $MOUNTPOINT
mount -o loop $INPUT_ISO $MOUNTPOINT
rsync -avz $MOUNTPOINT/ $WORKDIR
umount $MOUNTPOINT
rm -rf $MOUNTPOINT

# Customize
sed "s#kernelopt=runweasel#kernelopt=runweasel ks=$HTTP_ADDRESS#" -i $WORKDIR/boot.cfg

# Repack
genisoimage -relaxed-filenames -J -R -o $OUTPUT_ISO -b isolinux.bin -c boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -eltorito-alt-boot -e efiboot.img -no-emul-boot $WORKDIR
