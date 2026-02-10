.PHONY: serve

serve:
# 	hugo server -D --bind 0.0.0.0 -p 3000 --disableFastRender
	hugo server --buildDrafts --bind 0.0.0.0 -p 1313 --disableFastRender --navigateToChanged -s exampleSite --gc --themesDir=../..

# 常用别名
dev: serve