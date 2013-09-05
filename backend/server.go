package main

import (
	"net/http"
	"html/template"
	"os"
	"github.com/jessevdk/go-flags"
	playassets "local/assets"
)

type Options struct {
	Listen string `short:"l" long:"listen" description:"The address to listen on" default:":9876"`
	Data string `short:"d" long:"data" description:"Location where the data is stored" default:"data"`
}

var options Options
var indextempl *template.Template

func main() {
	if _, err := flags.Parse(&options); err != nil {
		os.Exit(1)
	}

	playassets.Assets.LocalPath = "./assets"

	indextempl = template.New("index")
	indextempl.Parse(string(playassets.Assets.Files["/index.html"].Data))

	http.ListenAndServe(options.Listen, nil)
}
