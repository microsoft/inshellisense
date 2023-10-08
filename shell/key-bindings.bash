__inshellisense__() {
    inshellisense -c "$READLINE_LINE" -s bash
    history -s $(inshellisense --history)
    READLINE_LINE=
}

bind -x '"\C-a": __inshellisense__'