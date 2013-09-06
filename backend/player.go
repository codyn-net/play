package main

import (
	"net"
	"net/http"
	"net/http/httputil"
	"encoding/json"
	"errors"
)

type Container struct {
	Id string
	Image string
}

type ContainerNetworkSettings struct {
	IpAddress string
}

type ContainerInfo struct {
	NetworkSettings ContainerNetworkSettings
}

var ErrPlayerNotRunning = errors.New("player is not running")

func dockerRequest(c *httputil.ClientConn, url string, data interface{}) error {
	req, err := http.NewRequest("GET", url, nil)

	if err != nil {
		return err
	}

	resp, err := c.Do(req)

	if err != nil {
		return err
	}

	defer resp.Body.Close()
	dec := json.NewDecoder(resp.Body)

	return dec.Decode(data)
}

func ResolveDockerPlayer() (string, error) {
	c, err := net.Dial("unix", "/var/run/docker.sock")

	if err != nil {
		return "", err
	}

	cc := httputil.NewClientConn(c, nil)

	containers := []Container{}

	if err := dockerRequest(cc, "/containers/json", &containers); err != nil {
		return "", err
	}

	var id string

	for _, c := range containers {
		if c.Image == "play.codyn.net:latest" {
			id = c.Id
			break
		}
	}

	if len(id) == 0 {
		return "", ErrPlayerNotRunning
	}

	info := ContainerInfo{}

	if err := dockerRequest(cc, "/containers/" + id + "/json", &info); err != nil {
		return "", err
	}

	return info.NetworkSettings.IpAddress + ":4785", nil
}
