.PHONY: serve build-css

run:
	hugo server -s exampleSite --gc --themesDir=../..

serve:
# 	hugo server -D --bind 0.0.0.0 -p 3000 --disableFastRender
	hugo server --buildDrafts --bind 0.0.0.0 -p 1313 --disableFastRender --navigateToChanged -s exampleSite --gc --themesDir=../..

build-css:
	npm run build:css

# 常用别名
dev: serve
