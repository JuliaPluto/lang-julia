# NPM ?= npm
# NPM ?= pnpm
NPM ?= yarn

# Written by humans
SRC = src/*.ts

# Generated
INDEX = dist/index.js dist/index.cjs

$(INDEX): $(SRC)
	$(NPM) run prepare

check: # Ensure tooling is installed
	node --version
	$(NPM) --version

clean: # Remove generated files
	rm -f $(INDEX)

release:
	$(NPM) publish
	git tag v$(cat package.json | jq -r .version)
