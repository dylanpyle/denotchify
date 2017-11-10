SHELL := /bin/bash

npm_bin = ./node_modules/.bin

.PHONY: lint
lint:
	$(npm_bin)/tslint 'src/**/*.ts'

.PHONY: clean
clean:
	@-rm -r dist

.PHONY: copy-static-assets
copy-static-assets:
	@mkdir -p dist
	@cp -R static/* dist

.PHONY: build
build: clean copy-static-assets
	$(npm_bin)/tsc

.PHONY: publish
publish: build
	@-rm -r docs
	@cp -R dist docs

.PHONY: dev
dev:
	fswatch -0 src/*.ts static/*.html | xargs -0n1 -I '{}' make build
