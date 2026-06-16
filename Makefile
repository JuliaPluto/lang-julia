.PHONY: build

SRC = src/*.ts

build: $(SRC)
	npm run prepare

release:
	npm publish
	git tag v$(shell cat package.json | jq -r .version)
