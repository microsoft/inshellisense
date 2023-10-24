__inshellisense__() {
    input=$LBUFFER
    LBUFFER=
    inshellisense -c "$input" -s zsh < $TTY
    print -s $(inshellisense --history)
    zle reset-prompt
}

zle     -N   __inshellisense __inshellisense__
bindkey '^A' __inshellisense