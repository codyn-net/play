ASSETS = $(shell find assets/ -type f)

ASSETSSRC = deps/src/local/assets/assets.go
ASSETSPKG = deps/pkg/darwin_amd64/local/assets.a

all: play

play: $(ASSETSPKG)
	@GOPATH=$$(pwd)/deps:$$GOPATH go build -o play

$(ASSETSPKG): $(ASSETSSRC)
	@GOPATH=$$(pwd)/deps:$$GOPATH go install local/assets

$(ASSETSSRC): $(ASSETS)
	go-assets-builder --output $@ --package playassets --strip-prefix /assets $^

clean:
	rm -f $(ASSETSSRC) $(ASSETSPKG)

.PHONY: all
