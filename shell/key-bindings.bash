__sa__() {
    sa -c "$READLINE_LINE" -s bash
    history -s $(sa --history)
    READLINE_LINE=
}

bind -x '"\C-a": __sa__'