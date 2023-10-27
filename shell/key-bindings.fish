function inshellisense-widget -d "Activate autocomplete"
    inshellisense -c (commandline -b) -s fish
    commandline -r ''
    commandline -f repaint
    # TODO: add support for history insertion
end

bind \ca inshellisense-widget