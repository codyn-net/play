FROM ubuntu:precise
MAINTAINER Jesse van den Kieboom <jesse@codyn.net>
RUN echo 'deb http://archive.ubuntu.com/ubuntu precise main universe' > /etc/apt/sources.list
RUN apt-get update
RUN apt-get -y install wget
RUN wget -P /etc/apt/sources.list.d/ http://packages.codyn.net/ubuntu/codyn-precise.list
RUN wget -O - http://packages.codyn.net/sign.key | apt-key add -
RUN apt-get update
RUN apt-get -y install libcodyn3 codyn3-tools python-gi cdn-rawc
RUN rm -f /usr/lib/codyn-3.0/io/libfile.so
RUN apt-get purge curl
