package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func handleScript(script string, writer http.ResponseWriter, req *http.Request) {
	// Spawn python checker
	buf := &bytes.Buffer{}
	errbuf := &bytes.Buffer{}

	if err := RunScript(req.Body, buf, errbuf, script); err != nil {
		msg := fmt.Sprintf("Failed to %s: %s\n\n%s", script, err, errbuf.String())
		http.Error(writer, msg, http.StatusInternalServerError)
	} else {
		writer.Header().Add("Content-type", "application/json")
		io.Copy(writer, buf)
	}
}

func handleCheck(writer http.ResponseWriter, req *http.Request) {
	handleScript("check", writer, req)
}

func handleRun(writer http.ResponseWriter, req *http.Request) {
	handleScript("run", writer, req)
}

func init() {
	http.HandleFunc("/check", handleCheck)
	http.HandleFunc("/run", handleRun)
}
