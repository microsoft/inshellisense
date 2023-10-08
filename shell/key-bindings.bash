__clac__() {
    clac -c "$READLINE_LINE" -s bash
    history -s $(clac --history)
}

bind -x '"\C-a": __clac__'