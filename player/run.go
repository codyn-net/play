package main

import (
	"net/http"
)

func handleRun(writer http.ResponseWriter, req *http.Request) {
	// Spawn python runner
	writer.Header().Add("Content-type", "application/json")

	if err := RunScript(req.Body, writer, "run"); err != nil {
		http.NotFound(writer, req)
	}
}

func init() {
	http.HandleFunc("/run", handleRun)
}
