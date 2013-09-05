package main

import (
	"net/http"
	"path"
	playassets "local/assets"
)

func handleIndex(writer http.ResponseWriter, req *http.Request) {
	indextempl.Execute(writer, `# New, empty codyn file

node "a" {
    x = "2 * pi"
}`)

}

func handleRoot(writer http.ResponseWriter, req *http.Request) {
	n := path.Clean(req.URL.Path)

	if n == "/" || n == "/index.html" {
		handleIndex(writer, req)
	} else {
		http.FileServer(playassets.Assets).ServeHTTP(writer, req)
	}
}

func init() {
	http.HandleFunc("/", handleRoot)
}
