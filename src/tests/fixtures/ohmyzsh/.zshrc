# Minimal .zshrc for oh-my-zsh + powerlevel10k E2E testing.
# This file is used as ZDOTDIR/.zshrc by the test fixture.

export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git)

source "$ZSH/oh-my-zsh.sh"

[[ ! -f "${ZDOTDIR:-$HOME}/.p10k.zsh" ]] || source "${ZDOTDIR:-$HOME}/.p10k.zsh"
