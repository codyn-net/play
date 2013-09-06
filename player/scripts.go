package main

import (
	"io"
	"os"
	"fmt"
	"os/exec"
	"path/filepath"
	"io/ioutil"
	playerassets "local/assets"
)

var scriptDirectory string

func RunScript(stdin io.Reader, stdout io.Writer, script string, args ...string) error {
	cmd := exec.Command(filepath.Join(scriptDirectory, script), args...)

	cmd.Dir = scriptDirectory

	cmd.Stdin = stdin
	cmd.Stdout = stdout

	return cmd.Run()
}

func init() {
	abs, err := filepath.Abs(filepath.Dir(os.Args[0]))

	if err != nil {
		panic(fmt.Sprintf("Could not get absolute path of current directory: %s", err))
	}

	scriptDirectory = filepath.Join(abs, "scripts")

	if err := os.MkdirAll(scriptDirectory, 0766); err != nil {
		panic(fmt.Sprintf("Failed to create scripts directory: %s", err))
	}

	a := playerassets.Assets

	// Extract scripts from assets to scripts directory
	for _, f := range a.Dirs["/scripts"] {
		file := a.Files["/scripts/" + f]

		err := ioutil.WriteFile(filepath.Join(scriptDirectory, f), file.Data, file.FileMode)

		if err != nil {
			panic(fmt.Sprintf("Failed to write script `%s': %s", f, err))
		}
	}
}
