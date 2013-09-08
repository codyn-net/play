package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func handleRun(writer http.ResponseWriter, req *http.Request) {
	// Spawn python checker
	buf := &bytes.Buffer{}
	errbuf := &bytes.Buffer{}

	if err := RunScript(req.Body, buf, errbuf, "run"); err != nil {
		msg := fmt.Sprintf("Failed to run: %s\n\n%s", err, errbuf.String())
		http.Error(writer, msg, http.StatusInternalServerError)
	} else {
		writer.Header().Add("Content-type", "application/json")
		io.Copy(writer, buf)
	}

}

func init() {
	http.HandleFunc("/run", handleRun)
}
