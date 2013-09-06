package main

import (
	"github.com/jessevdk/go-flags"
	playassets "local/assets"
	"net/http"
	"os"
	"strings"
)

type Options struct {
	Listen string `short:"l" long:"listen" description:"The address to listen on" default:":9876"`
	Data   string `short:"d" long:"data" description:"Location where the data is stored" default:"data"`
	Player string `short:"p" long:"player" description:"The address of the player server" default:"http://localhost:4785"`
}

var options Options

const DevelopmentMode = true

func main() {
	if _, err := flags.Parse(&options); err != nil {
		os.Exit(1)
	}

	if options.Player[0] == ':' {
		options.Player = "http://localhost" + options.Player
	} else if !strings.HasPrefix(options.Player, "http://") {
		options.Player = "http://" + options.Player
	}

	if !strings.HasSuffix(options.Player, "/") {
		options.Player += "/"
	}

	if DevelopmentMode {
		playassets.Assets.LocalPath = "./assets"
	}

	http.ListenAndServe(options.Listen, nil)
}
