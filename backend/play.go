package main

import (
	"fmt"
	"github.com/jessevdk/go-flags"
	playassets "local/assets"
	"net/http"
	"os"
	"strings"
)

type Options struct {
	Listen      string `short:"l" long:"listen" description:"The address to listen on" default:":9876"`
	Data        string `short:"d" long:"data" description:"Location where the data is stored" default:"data"`
	Player      string `short:"p" long:"player" description:"The address of the player server" default:""`
	Development bool   `long:"dev" description:"Enable development mode (implies player=http://localhost:4785)"`
}

var options Options

func main() {
	if _, err := flags.Parse(&options); err != nil {
		os.Exit(1)
	}

	if options.Development && len(options.Player) == 0 {
		options.Player = "http://localhost:4785"
	}

	if len(options.Player) == 0 {
		p, err := ResolveDockerPlayer()

		if err != nil {
			panic(fmt.Sprintf("Failed to connect to player (is it running?): %s", err))
		}

		options.Player = "http://" + p
	} else {
		if options.Player[0] == ':' {
			options.Player = "http://localhost" + options.Player
		} else if !strings.HasPrefix(options.Player, "http://") {
			options.Player = "http://" + options.Player
		}
	}

	if !strings.HasSuffix(options.Player, "/") {
		options.Player += "/"
	}

	if options.Development {
		playassets.Assets.LocalPath = "./assets"
	}

	if err := http.ListenAndServe(options.Listen, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Error while listening: %s\n", err)
		os.Exit(1)
	}
}
