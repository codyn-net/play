ASSETS = $(shell find assets/ -type f)
SOURCES = $(wildcard *.go)

UNAME = $(shell uname)
ARCH = $(shell uname -i)

ASSETSSRCDIR = deps/src/local/assets
ASSETSSRC = $(ASSETSSRCDIR)/assets.go

ifeq ($(UNAME),Linux)
osdir = linux
else
ifeq ($(UNAME),Darwin)
osdir = darwin
endif
endif

ifeq ($(ARCH),x86_64)
archdir = amd64
else
archdir = i386
endif

ASSETSPKG = $(ASSETSPKGDIR)/assets.a
ASSETSPKGDIR = deps/pkg/$(osdir)_$(archdir)/local

GO_ASSETS_BUILDER = deps/bin/go-assets-builder

ifeq ($(V),)
vecho = @echo $1;
else
vecho =
endif

all: play

play: $(ASSETSPKG) $(SOURCES)
	$(call vecho,[GC] play) \
	GOPATH=$$(pwd)/deps go build -o play

$(ASSETSPKG): $(ASSETSSRC)
	$(call vecho,[INSTALL] assets) \
	GOPATH=$$(pwd)/deps go install local/assets

$(ASSETSSRC): $(ASSETS) $(GO_ASSETS_BUILDER)
	$(call vecho,[BUILD] assets) \
	mkdir -p $(ASSETSSRCDIR) && \
	$(GO_ASSETS_BUILDER) --output $@ --package playassets --strip-prefix /assets $(ASSETS)

$(GO_ASSETS_BUILDER):
	$(call vecho,[INSTALL] go-assets-builder) \
	GOPATH=$$(pwd)/deps go get github.com/jessevdk/go-assets-builder && \
	GOPATH=$$(pwd)/deps go install github.com/jessevdk/go-assets-builder

clean:
	rm -f $(ASSETSSRC) $(ASSETSPKG); \
	rmdir -p $(ASSETSSRCDIR) 2>/dev/null; \
	rmdir -p $(ASSETSPKGDIR) 2>/dev/null

.PHONY: all
