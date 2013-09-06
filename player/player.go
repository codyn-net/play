package main

import (
	"net/http"
	"os"
	"github.com/jessevdk/go-flags"
)

type Options struct {
	Listen string `short:"l" long:"listen" description:"The address to listen on" default:":4785"`
}

var options Options

const DevelopmentMode = true

func main() {
	if _, err := flags.Parse(&options); err != nil {
		os.Exit(1)
	}

	http.ListenAndServe(options.Listen, nil)
}
