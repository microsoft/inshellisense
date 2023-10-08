__sa__() {
    sa -c "$READLINE_LINE" -s bash
    history -s $(sa --history)
}

bind -x '"\C-a": __sa__'