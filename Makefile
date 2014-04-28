CC            = gcc

INCLUDE_PCAP  = -I../../thirdparty/libpcap-1.3.0

INCLUDE_OTHER = -I../.. -I../../thirdparty \
                -I../../thirdparty/glib-2.34.3/glib \
                -I../../thirdparty/glib-2.34.3 \
                -I../../thirdparty/glib-2.34.3/gmodule \
                -I../../thirdparty/glib-2.34.3/gobject \
                -I../../thirdparty/libnids-1.24/src \
                -I../ -I../thirdparty

mkdir_p = mkdir -p --
INSTALL = /usr/bin/install -c
PLUGINDIR = /data/moloch/plugins


all:tagger.so netflow.so zmqexp.so

zmqexp.so: zmqexp.c ../moloch.h
	$(CC) -O2 -ggdb -Wall -Wextra -D_GNU_SOURCE -fPIC -c zmqexp.c $(INCLUDE_PCAP) $(INCLUDE_OTHER)
	$(CC) -shared -o zmqexp.so zmqexp.o -lzmq

tagger.so:tagger.c ../moloch.h
	$(CC) -O2 -ggdb -Wall -Wextra -D_GNU_SOURCE -fPIC -c tagger.c $(INCLUDE_PCAP) $(INCLUDE_OTHER)
	$(CC) -shared -o tagger.so tagger.o

netflow.so:netflow.c ../moloch.h
	$(CC) -O2 -ggdb -Wall -Wextra -D_GNU_SOURCE -fPIC -c netflow.c $(INCLUDE_PCAP) $(INCLUDE_OTHER)
	$(CC) -shared -o netflow.so netflow.o

install:
	test -z "$(PLUGINDIR)" || $(mkdir_p) "$(PLUGINDIR)"
	$(INSTALL) *.so $(PLUGINDIR)

distclean realclean clean:
	rm -f *.o *.so
