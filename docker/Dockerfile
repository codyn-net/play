FROM ubuntu:precise
MAINTAINER Jesse van den Kieboom <jesse@codyn.net>
RUN apt-get update
RUN apt-get -y install apt-utils
RUN apt-get -y install wget
RUN wget -P /etc/apt/sources.list.d/ http://packages.codyn.net/ubuntu/codyn-precise.list
RUN wget -O - http://packages.codyn.net/sign.key | apt-key add -
RUN apt-get update
RUN apt-get -y install libcodyn3 codyn3-tools python-gi cdn-rawc
RUN rm -f /usr/lib/codyn-3.0/io/libfile.so

RUN apt-get install -y git make
RUN wget -O - https://go.googlecode.com/files/go1.2.1.linux-amd64.tar.gz | tar -xz -C /usr/local
RUN cd /tmp && git clone git://codyn.net/codyn/play.git
RUN cd /tmp/play/player && GOROOT=/usr/local/go PATH=/usr/local/go/bin:$PATH make
RUN mkdir -p /var/lib/cdn-player && cp /tmp/play/player/player /var/lib/cdn-player/cdn-player
RUN rm -rf /tmp/play /usr/local/go
RUN apt-get purge -y wget git make
RUN apt-get autoremove -y

ENTRYPOINT ["/var/lib/cdn-player/cdn-player"]
WORKDIR /var/lib/cdn-player
