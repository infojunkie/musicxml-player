#/bin/sh

PATCH_FILES=$(ls ./patches/*.patch)

for f in $PATCH_FILES
do
  git apply --check --ignore-whitespace --reverse "$f" 2>/dev/null

  if [ "$?" -ne "0" ]; then
    git apply --ignore-whitespace "$f"
    echo "$f applied successfully!"
  else
    echo "$f already applied. Skipping..."
  fi
done
