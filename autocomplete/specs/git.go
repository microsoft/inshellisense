package specs

import (
	"github.com/cpendery/clac/autocomplete/generators/git"
	"github.com/cpendery/clac/autocomplete/model"
)

func init() {
	Specs["git"] = model.Subcommand{
		Name:        []string{"git"},
		Description: `The stupid content tracker`,
		Args: []model.Arg{{
			Name:        "alias",
			Description: `Custom user defined git alias`,
			Generator:   nil, // TODO: port over generator
			IsOptional:  true,
		}},
		Options: []model.Option{{
			Name:        []string{"--version"},
			Description: `Output version`,
		}, {
			Name:        []string{"--help"},
			Description: `Output help`,
		}, {
			Name:        []string{"-C"},
			Description: `Run as if git was started in <path>`,
			Args: []model.Arg{{
				Templates: []model.Template{model.TemplateFolders},
				Name:      "path",
			}},
		}, {
			Name:        []string{"-c"},
			Description: `Pass a config parameter to the command`,
			Args: []model.Arg{{
				Name: "name=value",
			}},
		}, {
			Name:        []string{"--exec-path"},
			Description: `Get or set GIT_EXEC_PATH for core Git programs`,
			Args: []model.Arg{{
				Templates:  []model.Template{model.TemplateFolders},
				Name:       "path",
				IsOptional: true,
			}},
		}, {
			Name:        []string{"--html-path"},
			Description: `Print Git’s HTML documentation path`,
		}, {
			Name:        []string{"--man-path"},
			Description: `Print the manpath for this version of Git`,
		}, {
			Name:        []string{"--info-path"},
			Description: `Print the info path documenting this version of Git`,
		}, {
			Name:        []string{"-p", "--paginate"},
			Description: `Pipe output into "less" or custom $PAGER`,
		}, {
			Name:        []string{"--no-pager"},
			Description: `Do not pipe Git output into a pager`,
		}, {
			Name:        []string{"--no-replace-objects"},
			Description: `Do not use replacement refs`,
		}, {
			Name:        []string{"--no-optional-locks"},
			Description: `Do not perform optional operations that require lock files`,
		}, {
			Name:        []string{"--bare"},
			Description: `Treat the repository as a bare repository`,
		}, {
			Name:        []string{"--git-dir"},
			Description: `Set the path to the repository dir (".git")`,
			Args: []model.Arg{{
				Templates: []model.Template{model.TemplateFolders},
				Name:      "path",
			}},
		}, {
			Name:        []string{"--work-tree"},
			Description: `Set working tree path`,
			Args: []model.Arg{{
				Templates: []model.Template{model.TemplateFolders},
				Name:      "path",
			}},
		}, {
			Name:        []string{"--namespace"},
			Description: `Set the Git namespace`,
			Args: []model.Arg{{
				Name: "name",
			}},
		}},
		Subcommands: []model.Subcommand{{
			Name:        []string{"archive"},
			Description: `Create an archive of files from a named tree`,
			Args: []model.Arg{{
				Name:      "tree-ish",
				Generator: nil, // TODO: port over generator
			}, {
				Templates:  []model.Template{model.TemplateFilepaths},
				Name:       "path",
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--format"},
				Description: `Archive format`,
				Args: []model.Arg{{
					Name:        "fmt",
					Suggestions: []model.Suggestion{{Name: []string{`tar`}}, {Name: []string{`zip`}}},
				}},
			}, {
				Name:        []string{"--prefix"},
				Description: `Prepend prefix to each pathname in the archive`,
				Args: []model.Arg{{
					Name: "prefix",
				}},
			}, {
				Name:        []string{"--add-file"},
				Description: `Add untracked file to archive`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"-o", "--output"},
				Description: `Write the archive to this file`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--worktree-attributes"},
				Description: `Read .gitattributes in working directory`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Report archived files on stderr`,
			}, {
				Name:        []string{"-NUM"},
				Description: `Set compression level`,
			}, {
				Name:        []string{"-l", "--list"},
				Description: `List supported archive formats`,
			}, {
				Name:        []string{"--remote"},
				Description: `Retrieve the archive from remote repository <repo>`,
				Args: []model.Arg{{
					Name: "repo",
				}},
			}, {
				Name:        []string{"--exec"},
				Description: `Path to the remote git-upload-archive command`,
				Args: []model.Arg{{
					Name: "command",
				}},
			}},
		}, {
			Name: []string{"blame"},
			Args: []model.Arg{{
				Templates: []model.Template{model.TemplateFilepaths},
				Name:      "file",
			}},
			Options: []model.Option{{
				Name:        []string{"--incremental"},
				Description: `Show blame entries as we find them, incrementally`,
			}, {
				Name:        []string{"-b"},
				Description: `Do not show object names of boundary commits (Default: off)`,
			}, {
				Name:        []string{"--root"},
				Description: `Do not treat root commits as boundaries (Default: off)`,
			}, {
				Name:        []string{"--show-stats"},
				Description: `Show work cost statistics`,
			}, {
				Name:        []string{"--progress"},
				Description: `Force progress reporting`,
			}, {
				Name:        []string{"--score-debug"},
				Description: `Show output score for blame entries`,
			}, {
				Name:        []string{"-f", "--show-name"},
				Description: `Show original filename (Default: auto)`,
			}, {
				Name:        []string{"-n", "--show-number"},
				Description: `Show original linenumber (Default: off)`,
			}, {
				Name:        []string{"-p", "--porcelain"},
				Description: `Show in a format designed for machine consumption`,
			}, {
				Name:        []string{"--line-porcelain"},
				Description: `Show porcelain format with per-line commit information`,
			}, {
				Name:        []string{"-c"},
				Description: `Use the same output mode as git-annotate (Default: off)`,
			}, {
				Name:        []string{"-t"},
				Description: `Show raw timestamp (Default: off)`,
			}, {
				Name:        []string{"-l"},
				Description: `Show long commit SHA1 (Default: off)`,
			}, {
				Name:        []string{"-s"},
				Description: `Suppress author name and timestamp (Default: off)`,
			}, {
				Name:        []string{"-e", "--show-email"},
				Description: `Show author email instead of name (Default: off)`,
			}, {
				Name:        []string{"-w"},
				Description: `Ignore whitespace differences`,
			}, {
				Name:        []string{"--ignore-rev"},
				Description: `Ignore <rev> when blaming`,
				Args: []model.Arg{{
					Name:      "rev",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--ignore-revs-file"},
				Description: `Ignore revisions from <file>`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--color-lines"},
				Description: `Color redundant metadata from previous line differently`,
			}, {
				Name:        []string{"--color-by-age"},
				Description: `Color lines by age`,
			}, {
				Name:        []string{"--minimal"},
				Description: `Spend extra cycles to find better match`,
			}, {
				Name:        []string{"-S"},
				Description: `Use revisions from <file> instead of calling git-rev-list`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--contents"},
				Description: `Use <file>'s contents as the final image`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"-C"},
				Description: `Find line copies within and across files`,
			}, {
				Name:        []string{"-M"},
				Description: `Find line movements within and across files`,
			}, {
				Name:        []string{"-L"},
				Description: `Process only line range <start>,<end> or function :<funcname>`,
				Args: []model.Arg{{
					Name: "start,end",
				}},
			}, {
				Name:        []string{"--abbrev"},
				Description: `Use <n> digits to display object names`,
				Args: []model.Arg{{
					Name:       "n",
					IsOptional: true,
				}},
			}},
		}, {
			Name:        []string{"commit"},
			Description: `Record changes to the repository`,
			Args: []model.Arg{{
				Templates:  []model.Template{model.TemplateFilepaths},
				Name:       "pathspec",
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-m", "--message"},
				Description: `Use the given message as the commit message`,
				Args: []model.Arg{{
					Name:      "message",
					Generator: git.CommitMessageGenerator(),
				}},
			}, {
				Name:        []string{"-a", "--all"},
				Description: `Stage all modified and deleted paths`,
			}, {
				Name:        []string{"-am"},
				Description: `Stage all and use given text as commit message`,
				Args: []model.Arg{{
					Name: "message",
				}},
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Show unified diff of all file changes`,
			}, {
				Name:        []string{"-p", "--patch"},
				Description: `Use the interactive patch selection interface to chose which changes to commi`,
			}, {
				Name:        []string{"-C", "--reuse-message"},
				Description: `Take an existing commit object, and reuse the log message and the authorship`,
				Args: []model.Arg{{
					Name:      "commit",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"-c", "--reedit-message"},
				Description: `Like -C, but with -c the editor is invoked, so that the user can further edit`,
				Args: []model.Arg{{
					Name:      "commit",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--fixup"},
				Description: `Construct a commit message for use with rebase --autosquash. The commit messa`,
				Args: []model.Arg{{
					Name:      "commit",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--squash"},
				Description: `Construct a commit message for use with rebase --autosquash. The commit messa`,
				Args: []model.Arg{{
					Name:      "commit",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--reset-author"},
				Description: `When used with -C/-c/--amend options, or when committing after a conflicting`,
			}, {
				Name:        []string{"--short"},
				Description: `When doing a dry-run, give the output in the short-format. See git-status[1]`,
			}, {
				Name:        []string{"--branch"},
				Description: `Show the branch and tracking info even in short-format`,
			}, {
				Name:        []string{"--porcelain"},
				Description: `When doing a dry-run, give the output in a porcelain-ready format. See git-st`,
			}, {
				Name:        []string{"--long"},
				Description: `When doing a dry-run, give the output in the long-format. Implies --dry-run`,
			}, {
				Name:        []string{"-z", "--null"},
				Description: `When showing short or porcelain status output, print the filename verbatim an`,
			}, {
				Name:        []string{"-F", "--file"},
				Description: `Take the commit message from the given file. Use - to read the message from t`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--author"},
				Description: `Override the commit author. Specify an explicit author using the standard A U`,
				Args: []model.Arg{{
					Name: "author",
				}},
			}, {
				Name:        []string{"--date"},
				Description: `Override the author date used in the commit`,
				Args: []model.Arg{{
					Name: "date",
				}},
			}, {
				Name:        []string{"-t", "--template"},
				Description: `When editing the commit message, start the editor with the contents in the gi`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"-s", "--signoff"},
				Description: `Add a Signed-off-by trailer by the committer at the end of the commit log mes`,
			}, {
				Name:        []string{"--no-signoff"},
				Description: `Don't add a Signed-off-by trailer by the committer at the end of the commit l`,
			}, {
				Name:        []string{"-n", "--no-verify"},
				Description: `This option bypasses the pre-commit and commit-msg hooks. See also githooks[5]`,
			}, {
				Name:        []string{"--allow-empty"},
				Description: `Usually recording a commit that has the exact same tree as its sole parent co`,
			}, {
				Name:        []string{"--allow-empty-message"},
				Description: `Like --allow-empty this command is primarily for use by foreign SCM interface`,
			}, {
				Name:        []string{"--cleanup"},
				Description: `This option determines how the supplied commit message should be cleaned up b`,
				Args: []model.Arg{{
					Name:        "mode",
					Description: `Determines how the supplied commit messaged should be cleaned up before committing`,
					Suggestions: []model.Suggestion{{
						Name:        []string{`strip`},
						Description: `Strip leading and trailing empty lines, trailing whitepace, commentary and collapse consecutive empty lines`,
					}, {
						Name:        []string{`whitespace`},
						Description: `Same as strip except #commentary is not removed`,
					}, {
						Name:        []string{`verbatim`},
						Description: `Do not change the message at all`,
					}, {
						Name:        []string{`scissors`},
						Description: `Same as whitespace except that everything from (and including) the line found below is truncated`,
					}, {
						Name:        []string{`default`},
						Description: `Same as strip if the message is to be edited. Otherwise whitespace`,
					}},
				}},
			}, {
				Name:        []string{"-e", "--edit"},
				Description: `The message taken from file with -F, command line with -m, and from commit ob`,
			}, {
				Name:        []string{"--no-edit"},
				Description: `Use the selected commit message without launching an editor. For example, git`,
			}, {
				Name:        []string{"--amend"},
				Description: `Replace the tip of the current branch by creating a new commit. The recorded`,
			}, {
				Name:        []string{"--no-post-rewrite"},
				Description: `Bypass the post-rewrite hook`,
			}, {
				Name:        []string{"-i", "--include"},
				Description: `Before making a commit out of staged contents so far, stage the contents of p`,
			}, {
				Name:        []string{"-o", "--only"},
				Description: `Make a commit by taking the updated working tree contents of the paths specif`,
			}, {
				Name:        []string{"--pathspec-from-file"},
				Description: `Pathspec is passed in instead of commandline args. If is exactly - then stand`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--pathspec-file-nul"},
				Description: `Only meaningful with --pathspec-from-file. Pathspec elements are separated wi`,
			}, {
				Name:        []string{"-u", "--untracked-files"},
				Description: `Show untracked files. The mode parameter is optional (defaults to all), and i`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`no`}}, {Name: []string{`normal`}}, {Name: []string{`all`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Suppress commit summary message`,
			}, {
				Name:        []string{"--dry-run"},
				Description: `Do not create a commit, but show a list of paths that are to be committed, pa`,
			}, {
				Name:        []string{"--status"},
				Description: `Include the output of git-status[1] in the commit message template when using`,
			}, {
				Name:        []string{"--no-status"},
				Description: `Do not include the output of git-status[1] in the commit message template whe`,
			}, {
				Name:        []string{"-S", "--gpg-sign"},
				Description: `GPG-sign commits. The keyid argument is optional and defaults to the committe`,
				Args: []model.Arg{{
					Name:       "keyid",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-gpg-sign"},
				Description: `Dont GPG-sign commits`,
			}, {
				Name:        []string{"--"},
				Description: `Do not interpret any more arguments as options`,
			}},
		}, {
			Name:        []string{"config"},
			Description: `Change Git configuration`,
			Args: []model.Arg{{
				Name: "setting",
				Suggestions: []model.Suggestion{{
					Name:        []string{`add.ignore-errors`},
					Description: `Tells 'git add' to continue adding files when some files cannot be added due to indexing errors. Equivalent to the "--ignore-errors" option of git-add[1]. "add.ignore-errors" is deprecated, as it does not follow the usual naming convention for configuration variables`,
				}, {
					Name:        []string{`add.interactive.useBuiltin`},
					Description: `Set to "false" to fall back to the original Perl implementation of the interactive version of git-add[1] instead of the built-in version. Is "true" by default`,
				}, {
					Name:        []string{`advice.addEmbeddedRepo`},
					Description: `Advice on what to do when you've accidentally added one git repo inside of another`,
				}, {
					Name:        []string{`advice.addEmptyPathspec`},
					Description: `Advice shown if a user runs the add command without providing the pathspec parameter`,
				}, {
					Name:        []string{`advice.addIgnoredFile`},
					Description: `Advice shown if a user attempts to add an ignored file to the index`,
				}, {
					Name:        []string{`advice.ambiguousFetchRefspec`},
					Description: `Advice shown when fetch refspec for multiple remotes map to the same remote-tracking branch namespace and causes branch tracking set-up to fail`,
				}, {
					Name:        []string{`advice.amWorkDir`},
					Description: `Advice that shows the location of the patch file when git-am[1] fails to apply it`,
				}, {
					Name:        []string{`advice.checkoutAmbiguousRemoteBranchName`},
					Description: `Advice shown when the argument to git-checkout[1] and git-switch[1] ambiguously resolves to a remote tracking branch on more than one remote in situations where an unambiguous argument would have otherwise caused a remote-tracking branch to be checked out. See the "checkout.defaultRemote" configuration variable for how to set a given remote to used by default in some situations where this advice would be printed`,
				}, {
					Name:        []string{`advice.commitBeforeMerge`},
					Description: `Advice shown when git-merge[1] refuses to merge to avoid overwriting local changes`,
				}, {
					Name:        []string{`advice.detachedHead`},
					Description: `Advice shown when you used git-switch[1] or git-checkout[1] to move to the detach HEAD state, to instruct how to create a local branch after the fact`,
				}, {
					Name:        []string{`advice.fetchShowForcedUpdates`},
					Description: `Advice shown when git-fetch[1] takes a long time to calculate forced updates after ref updates, or to warn that the check is disabled`,
				}, {
					Name:        []string{`advice.ignoredHook`},
					Description: `Advice shown if a hook is ignored because the hook is not set as executable`,
				}, {
					Name:        []string{`advice.implicitIdentity`},
					Description: `Advice on how to set your identity configuration when your information is guessed from the system username and domain name`,
				}, {
					Name:        []string{`advice.nestedTag`},
					Description: `Advice shown if a user attempts to recursively tag a tag object`,
				}, {
					Name:        []string{`advice.pushAlreadyExists`},
					Description: `Shown when git-push[1] rejects an update that does not qualify for fast-forwarding (e.g., a tag.)`,
				}, {
					Name:        []string{`advice.pushFetchFirst`},
					Description: `Shown when git-push[1] rejects an update that tries to overwrite a remote ref that points at an object we do not have`,
				}, {
					Name:        []string{`advice.pushNeedsForce`},
					Description: `Shown when git-push[1] rejects an update that tries to overwrite a remote ref that points at an object that is not a commit-ish, or make the remote ref point at an object that is not a commit-ish`,
				}, {
					Name:        []string{`advice.pushNonFFCurrent`},
					Description: `Advice shown when git-push[1] fails due to a non-fast-forward update to the current branch`,
				}, {
					Name:        []string{`advice.pushNonFFMatching`},
					Description: `Advice shown when you ran git-push[1] and pushed 'matching refs' explicitly (i.e. you used ':', or specified a refspec that isn't your current branch) and it resulted in a non-fast-forward error`,
				}, {
					Name:        []string{`advice.pushRefNeedsUpdate`},
					Description: `Shown when git-push[1] rejects a forced update of a branch when its remote-tracking ref has updates that we do not have locally`,
				}, {
					Name:        []string{`advice.pushUnqualifiedRefname`},
					Description: `Shown when git-push[1] gives up trying to guess based on the source and destination refs what remote ref namespace the source belongs in, but where we can still suggest that the user push to either refs/heads/* or refs/tags/* based on the type of the source object`,
				}, {
					Name:        []string{`advice.pushUpdateRejected`},
					Description: `Set this variable to 'false' if you want to disable 'pushNonFFCurrent', 'pushNonFFMatching', 'pushAlreadyExists', 'pushFetchFirst', 'pushNeedsForce', and 'pushRefNeedsUpdate' simultaneously`,
				}, {
					Name:        []string{`advice.resetNoRefresh`},
					Description: `Advice to consider using the "--no-refresh" option to git-reset[1] when the command takes more than 2 seconds to refresh the index after reset`,
				}, {
					Name:        []string{`advice.resolveConflict`},
					Description: `Advice shown by various commands when conflicts prevent the operation from being performed`,
				}, {
					Name:        []string{`advice.rmHints`},
					Description: `In case of failure in the output of git-rm[1], show directions on how to proceed from the current state`,
				}, {
					Name:        []string{`advice.sequencerInUse`},
					Description: `Advice shown when a sequencer command is already in progress`,
				}, {
					Name:        []string{`advice.skippedCherryPicks`},
					Description: `Shown when git-rebase[1] skips a commit that has already been cherry-picked onto the upstream branch`,
				}, {
					Name:        []string{`advice.statusAheadBehind`},
					Description: `Shown when git-status[1] computes the ahead/behind counts for a local ref compared to its remote tracking ref, and that calculation takes longer than expected. Will not appear if "status.aheadBehind" is false or the option "--no-ahead-behind" is given`,
				}, {
					Name:        []string{`advice.statusHints`},
					Description: `Show directions on how to proceed from the current state in the output of git-status[1], in the template shown when writing commit messages in git-commit[1], and in the help message shown by git-switch[1] or git-checkout[1] when switching branch`,
				}, {
					Name:        []string{`advice.statusUoption`},
					Description: `Advise to consider using the "-u" option to git-status[1] when the command takes more than 2 seconds to enumerate untracked files`,
				}, {
					Name:        []string{`advice.submoduleAlternateErrorStrategyDie`},
					Description: `Advice shown when a submodule.alternateErrorStrategy option configured to "die" causes a fatal error`,
				}, {
					Name:        []string{`advice.submodulesNotUpdated`},
					Description: `Advice shown when a user runs a submodule command that fails because "git submodule update --init" was not run`,
				}, {
					Name:        []string{`advice.suggestDetachingHead`},
					Description: `Advice shown when git-switch[1] refuses to detach HEAD without the explicit "--detach" option`,
				}, {
					Name:        []string{`advice.updateSparsePath`},
					Description: `Advice shown when either git-add[1] or git-rm[1] is asked to update index entries outside the current sparse checkout`,
				}, {
					Name:        []string{`advice.waitingForEditor`},
					Description: `Print a message to the terminal whenever Git is waiting for editor input from the user`,
				}, {
					Name:        []string{`alias.*`},
					Description: `Command aliases for the git[1] command wrapper - e.g. after defining "alias.last = cat-file commit HEAD", the invocation "git last" is equivalent to "git cat-file commit HEAD". To avoid confusion and troubles with script usage, aliases that hide existing Git commands are ignored. Arguments are split by spaces, the usual shell quoting and escaping is supported. A quote pair or a backslash can be used to quote them`,
				}, {
					Name:        []string{`am.keepcr`},
					Description: `If true, git-am will call git-mailsplit for patches in mbox format with parameter "--keep-cr". In this case git-mailsplit will not remove "\\r" from lines ending with "\\r\\n". Can be overridden by giving "--no-keep-cr" from the command line. See git-am[1], git-mailsplit[1]`,
				}, {
					Name:        []string{`am.threeWay`},
					Description: `By default, "git am" will fail if the patch does not apply cleanly. When set to true, this setting tells "git am" to fall back on 3-way merge if the patch records the identity of blobs it is supposed to apply to and we have those blobs available locally (equivalent to giving the "--3way" option from the command line). Defaults to "false". See git-am[1]`,
				}, {
					Name:        []string{`apply.ignoreWhitespace`},
					Description: `When set to 'change', tells 'git apply' to ignore changes in whitespace, in the same way as the "--ignore-space-change" option. When set to one of: no, none, never, false tells 'git apply' to respect all whitespace differences. See git-apply[1]`,
				}, {
					Name:        []string{`apply.whitespace`},
					Description: `Tells 'git apply' how to handle whitespaces, in the same way as the "--whitespace" option. See git-apply[1]`,
				}, {
					Name:        []string{`blame.blankBoundary`},
					Description: `Show blank commit object name for boundary commits in git-blame[1]. This option defaults to false`,
				}, {
					Name:        []string{`blame.coloring`},
					Description: `This determines the coloring scheme to be applied to blame output. It can be 'repeatedLines', 'highlightRecent', or 'none' which is the default`,
				}, {
					Name:        []string{`blame.date`},
					Description: `Specifies the format used to output dates in git-blame[1]. If unset the iso format is used. For supported values, see the discussion of the "--date" option at git-log[1]`,
				}, {
					Name:        []string{`blame.ignoreRevsFile`},
					Description: `Ignore revisions listed in the file, one unabbreviated object name per line, in git-blame[1]. Whitespace and comments beginning with "#" are ignored. This option may be repeated multiple times. Empty file names will reset the list of ignored revisions. This option will be handled before the command line option "--ignore-revs-file"`,
				}, {
					Name:        []string{`blame.markIgnoredLines`},
					Description: `Mark lines that were changed by an ignored revision that we attributed to another commit with a '?' in the output of git-blame[1]`,
				}, {
					Name:        []string{`blame.markUnblamableLines`},
					Description: `Mark lines that were changed by an ignored revision that we could not attribute to another commit with a '*' in the output of git-blame[1]`,
				}, {
					Name:        []string{`blame.showEmail`},
					Description: `Show the author email instead of author name in git-blame[1]. This option defaults to false`,
				}, {
					Name:        []string{`blame.showRoot`},
					Description: `Do not treat root commits as boundaries in git-blame[1]. This option defaults to false`,
				}, {
					Name:        []string{`branch.<name>.description`},
					Description: `Branch description, can be edited with "git branch --edit-description". Branch description is automatically added in the format-patch cover letter or request-pull summary`,
				}, {
					Name:        []string{`branch.<name>.merge`},
					Description: `Defines, together with branch.<name>.remote, the upstream branch for the given branch. It tells 'git fetch'/'git pull'/'git rebase' which branch to merge and can also affect 'git push' (see push.default). When in branch <name>, it tells 'git fetch' the default refspec to be marked for merging in FETCH_HEAD. The value is handled like the remote part of a refspec, and must match a ref which is fetched from the remote given by "branch.<name>.remote". The merge information is used by 'git pull' (which at first calls 'git fetch') to lookup the default branch for merging. Without this option, 'git pull' defaults to merge the first refspec fetched. Specify multiple values to get an octopus merge. If you wish to setup 'git pull' so that it merges into <name> from another branch in the local repository, you can point branch.<name>.merge to the desired branch, and use the relative path setting "." (a period) for branch.<name>.remote`,
				}, {
					Name:        []string{`branch.<name>.mergeOptions`},
					Description: `Sets default options for merging into branch <name>. The syntax and supported options are the same as those of git-merge[1], but option values containing whitespace characters are currently not supported`,
				}, {
					Name:        []string{`branch.<name>.pushRemote`},
					Description: `When on branch <name>, it overrides "branch.<name>.remote" for pushing. It also overrides "remote.pushDefault" for pushing from branch <name>. When you pull from one place (e.g. your upstream) and push to another place (e.g. your own publishing repository), you would want to set "remote.pushDefault" to specify the remote to push to for all branches, and use this option to override it for a specific branch`,
				}, {
					Name:        []string{`branch.<name>.rebase`},
					Description: `When true, rebase the branch <name> on top of the fetched branch, instead of merging the default branch from the default remote when "git pull" is run. See "pull.rebase" for doing this in a non branch-specific manner`,
				}, {
					Name:        []string{`branch.<name>.remote`},
					Description: `When on branch <name>, it tells 'git fetch' and 'git push' which remote to fetch from/push to. The remote to push to may be overridden with "remote.pushDefault" (for all branches). The remote to push to, for the current branch, may be further overridden by "branch.<name>.pushRemote". If no remote is configured, or if you are not on any branch and there is more than one remote defined in the repository, it defaults to "origin" for fetching and "remote.pushDefault" for pushing. Additionally, "." (a period) is the current local repository (a dot-repository), see "branch.<name>.merge"'s final note below`,
				}, {
					Name:        []string{`branch.autoSetupMerge`},
					Description: `Tells 'git branch', 'git switch' and 'git checkout' to set up new branches so that git-pull[1] will appropriately merge from the starting point branch. Note that even if this option is not set, this behavior can be chosen per-branch using the "--track" and "--no-track" options. The valid settings are: "false" -- no automatic setup is done; "true" -- automatic setup is done when the starting point is a remote-tracking branch; "always" -- automatic setup is done when the starting point is either a local branch or remote-tracking branch; "inherit" -- if the starting point has a tracking configuration, it is copied to the new branch; "simple" -- automatic setup is done only when the starting point is a remote-tracking branch and the new branch has the same name as the remote branch. This option defaults to true`,
				}, {
					Name:        []string{`branch.autoSetupRebase`},
					Description: `When a new branch is created with 'git branch', 'git switch' or 'git checkout' that tracks another branch, this variable tells Git to set up pull to rebase instead of merge (see "branch.<name>.rebase"). When "never", rebase is never automatically set to true. When "local", rebase is set to true for tracked branches of other local branches. When "remote", rebase is set to true for tracked branches of remote-tracking branches. When "always", rebase will be set to true for all tracking branches. See "branch.autoSetupMerge" for details on how to set up a branch to track another branch. This option defaults to never`,
				}, {
					Name:        []string{`branch.sort`},
					Description: `This variable controls the sort ordering of branches when displayed by git-branch[1]. Without the "--sort=<value>" option provided, the value of this variable will be used as the default. See git-for-each-ref[1] field names for valid values`,
				}, {
					Name:        []string{`browser.<tool>.cmd`},
					Description: `Specify the command to invoke the specified browser. The specified command is evaluated in shell with the URLs passed as arguments. (See git-web{litdd}browse[1].)`,
				}, {
					Name:        []string{`browser.<tool>.path`},
					Description: `Override the path for the given tool that may be used to browse HTML help (see "-w" option in git-help[1]) or a working repository in gitweb (see git-instaweb[1])`,
				}, {
					Name:        []string{`checkout.defaultRemote`},
					Description: `When you run "git checkout <something>" or "git switch <something>" and only have one remote, it may implicitly fall back on checking out and tracking e.g. "origin/<something>". This stops working as soon as you have more than one remote with a "<something>" reference. This setting allows for setting the name of a preferred remote that should always win when it comes to disambiguation. The typical use-case is to set this to "origin"`,
				}, {
					Name:        []string{`checkout.guess`},
					Description: `Provides the default value for the "--guess" or "--no-guess" option in "git checkout" and "git switch". See git-switch[1] and git-checkout[1]`,
				}, {
					Name:        []string{`checkout.thresholdForParallelism`},
					Description: `When running parallel checkout with a small number of files, the cost of subprocess spawning and inter-process communication might outweigh the parallelization gains. This setting allows to define the minimum number of files for which parallel checkout should be attempted. The default is 100`,
				}, {
					Name:        []string{`checkout.workers`},
					Description: `The number of parallel workers to use when updating the working tree. The default is one, i.e. sequential execution. If set to a value less than one, Git will use as many workers as the number of logical cores available. This setting and "checkout.thresholdForParallelism" affect all commands that perform checkout. E.g. checkout, clone, reset, sparse-checkout, etc`,
				}, {
					Name:        []string{`clean.requireForce`},
					Description: `A boolean to make git-clean do nothing unless given -f, -i or -n. Defaults to true`,
				}, {
					Name:        []string{`clone.defaultRemoteName`},
					Description: `The name of the remote to create when cloning a repository. Defaults to "origin", and can be overridden by passing the "--origin" command-line option to git-clone[1]`,
				}, {
					Name:        []string{`clone.filterSubmodules`},
					Description: `If a partial clone filter is provided (see "--filter" in git-rev-list[1]) and "--recurse-submodules" is used, also apply the filter to submodules`,
				}, {
					Name:        []string{`clone.rejectShallow`},
					Description: `Reject to clone a repository if it is a shallow one, can be overridden by passing option "--reject-shallow" in command line. See git-clone[1]`,
				}, {
					Name:        []string{`color.advice`},
					Description: `A boolean to enable/disable color in hints (e.g. when a push failed, see "advice.*" for a list). May be set to "always", "false" (or "never") or "auto" (or "true"), in which case colors are used only when the error output goes to a terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.advice.hint`},
					Description: `Use customized color for hints`,
				}, {
					Name:        []string{`color.blame.highlightRecent`},
					Description: `Specify the line annotation color for "git blame --color-by-age" depending upon the age of the line`,
				}, {
					Name:        []string{`color.blame.repeatedLines`},
					Description: `Use the specified color to colorize line annotations for "git blame --color-lines", if they come from the same commit as the preceding line. Defaults to cyan`,
				}, {
					Name:        []string{`color.branch`},
					Description: `A boolean to enable/disable color in the output of git-branch[1]. May be set to "always", "false" (or "never") or "auto" (or "true"), in which case colors are used only when the output is to a terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.branch.<slot>`},
					Description: `Use customized color for branch coloration. "<slot>" is one of "current" (the current branch), "local" (a local branch), "remote" (a remote-tracking branch in refs/remotes/), "upstream" (upstream tracking branch), "plain" (other refs)`,
				}, {
					Name:        []string{`color.decorate.<slot>`},
					Description: `Use customized color for 'git log --decorate' output. "<slot>" is one of "branch", "remoteBranch", "tag", "stash" or "HEAD" for local branches, remote-tracking branches, tags, stash and HEAD, respectively and "grafted" for grafted commits`,
				}, {
					Name:        []string{`color.diff`},
					Description: `Whether to use ANSI escape sequences to add color to patches. If this is set to "always", git-diff[1], git-log[1], and git-show[1] will use color for all patches. If it is set to "true" or "auto", those commands will only use color when output is to the terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.diff.<slot>`},
					Description: `Use customized color for diff colorization. "<slot>" specifies which part of the patch to use the specified color, and is one of "context" (context text - "plain" is a historical synonym), "meta" (metainformation), "frag" (hunk header), 'func' (function in hunk header), "old" (removed lines), "new" (added lines), "commit" (commit headers), "whitespace" (highlighting whitespace errors), "oldMoved" (deleted lines), "newMoved" (added lines), "oldMovedDimmed", "oldMovedAlternative", "oldMovedAlternativeDimmed", "newMovedDimmed", "newMovedAlternative" "newMovedAlternativeDimmed" (See the '<mode>' setting of '--color-moved' in git-diff[1] for details), "contextDimmed", "oldDimmed", "newDimmed", "contextBold", "oldBold", and "newBold" (see git-range-diff[1] for details)`,
				}, {
					Name:        []string{`color.grep`},
					Description: `When set to "always", always highlight matches. When "false" (or "never"), never. When set to "true" or "auto", use color only when the output is written to the terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.grep.<slot>`},
					Description: `Use customized color for grep colorization. "<slot>" specifies which part of the line to use the specified color, and is one of`,
				}, {
					Name:        []string{`color.interactive`},
					Description: `When set to "always", always use colors for interactive prompts and displays (such as those used by "git-add --interactive" and "git-clean --interactive"). When false (or "never"), never. When set to "true" or "auto", use colors only when the output is to the terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.interactive.<slot>`},
					Description: `Use customized color for 'git add --interactive' and 'git clean --interactive' output. "<slot>" may be "prompt", "header", "help" or "error", for four distinct types of normal output from interactive commands`,
				}, {
					Name:        []string{`color.pager`},
					Description: `A boolean to specify whether "auto" color modes should colorize output going to the pager. Defaults to true; set this to false if your pager does not understand ANSI color codes`,
				}, {
					Name:        []string{`color.push`},
					Description: `A boolean to enable/disable color in push errors. May be set to "always", "false" (or "never") or "auto" (or "true"), in which case colors are used only when the error output goes to a terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.push.error`},
					Description: `Use customized color for push errors`,
				}, {
					Name:        []string{`color.remote`},
					Description: `If set, keywords at the start of the line are highlighted. The keywords are "error", "warning", "hint" and "success", and are matched case-insensitively. May be set to "always", "false" (or "never") or "auto" (or "true"). If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.remote.<slot>`},
					Description: `Use customized color for each remote keyword. "<slot>" may be "hint", "warning", "success" or "error" which match the corresponding keyword`,
				}, {
					Name:        []string{`color.showBranch`},
					Description: `A boolean to enable/disable color in the output of git-show-branch[1]. May be set to "always", "false" (or "never") or "auto" (or "true"), in which case colors are used only when the output is to a terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.status`},
					Description: `A boolean to enable/disable color in the output of git-status[1]. May be set to "always", "false" (or "never") or "auto" (or "true"), in which case colors are used only when the output is to a terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.status.<slot>`},
					Description: `Use customized color for status colorization. "<slot>" is one of "header" (the header text of the status message), "added" or "updated" (files which are added but not committed), "changed" (files which are changed but not added in the index), "untracked" (files which are not tracked by Git), "branch" (the current branch), "nobranch" (the color the 'no branch' warning is shown in, defaulting to red), "localBranch" or "remoteBranch" (the local and remote branch names, respectively, when branch and tracking information is displayed in the status short-format), or "unmerged" (files which have unmerged changes)`,
				}, {
					Name:        []string{`color.transport`},
					Description: `A boolean to enable/disable color when pushes are rejected. May be set to "always", "false" (or "never") or "auto" (or "true"), in which case colors are used only when the error output goes to a terminal. If unset, then the value of "color.ui" is used ("auto" by default)`,
				}, {
					Name:        []string{`color.transport.rejected`},
					Description: `Use customized color when a push was rejected`,
				}, {
					Name:        []string{`color.ui`},
					Description: `This variable determines the default value for variables such as "color.diff" and "color.grep" that control the use of color per command family. Its scope will expand as more commands learn configuration to set a default for the "--color" option. Set it to "false" or "never" if you prefer Git commands not to use color unless enabled explicitly with some other configuration or the "--color" option. Set it to "always" if you want all output not intended for machine consumption to use color, to "true" or "auto" (this is the default since Git 1.8.4) if you want such output to use color when written to the terminal`,
				}, {
					Name:        []string{`column.branch`},
					Description: `Specify whether to output branch listing in "git branch" in columns. See "column.ui" for details`,
				}, {
					Name:        []string{`column.clean`},
					Description: `Specify the layout when list items in "git clean -i", which always shows files and directories in columns. See "column.ui" for details`,
				}, {
					Name:        []string{`column.status`},
					Description: `Specify whether to output untracked files in "git status" in columns. See "column.ui" for details`,
				}, {
					Name:        []string{`column.tag`},
					Description: `Specify whether to output tag listing in "git tag" in columns. See "column.ui" for details`,
				}, {
					Name:        []string{`column.ui`},
					Description: `Specify whether supported commands should output in columns. This variable consists of a list of tokens separated by spaces or commas:`,
				}, {
					Name:        []string{`commit.cleanup`},
					Description: `This setting overrides the default of the "--cleanup" option in "git commit". See git-commit[1] for details. Changing the default can be useful when you always want to keep lines that begin with comment character "#" in your log message, in which case you would do "git config commit.cleanup whitespace" (note that you will have to remove the help lines that begin with "#" in the commit log template yourself, if you do this)`,
				}, {
					Name:        []string{`commit.status`},
					Description: `A boolean to enable/disable inclusion of status information in the commit message template when using an editor to prepare the commit message. Defaults to true`,
				}, {
					Name:        []string{`commit.template`},
					Description: `Specify the pathname of a file to use as the template for new commit messages`,
				}, {
					Name:        []string{`commit.verbose`},
					Description: `A boolean or int to specify the level of verbose with "git commit". See git-commit[1]`,
				}, {
					Name:        []string{`commitGraph.generationVersion`},
					Description: `Specifies the type of generation number version to use when writing or reading the commit-graph file. If version 1 is specified, then the corrected commit dates will not be written or read. Defaults to 2`,
				}, {
					Name:        []string{`commitGraph.maxNewFilters`},
					Description: `Specifies the default value for the "--max-new-filters" option of "git commit-graph write" (c.f., git-commit-graph[1])`,
				}, {
					Name:        []string{`commitGraph.readChangedPaths`},
					Description: `If true, then git will use the changed-path Bloom filters in the commit-graph file (if it exists, and they are present). Defaults to true. See git-commit-graph[1] for more information`,
				}, {
					Name:        []string{`committer.email`},
					Description: `The "user.name" and "user.email" variables determine what ends up in the "author" and "committer" field of commit objects. If you need the "author" or "committer" to be different, the "author.name", "author.email", "committer.name" or "committer.email" variables can be set. Also, all of these can be overridden by the "GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL" and "EMAIL" environment variables`,
				}, {
					Name:        []string{`completion.commands`},
					Description: `This is only used by git-completion.bash to add or remove commands from the list of completed commands. Normally only porcelain commands and a few select others are completed. You can add more commands, separated by space, in this variable. Prefixing the command with '-' will remove it from the existing list`,
				}, {
					Name:        []string{`core.abbrev`},
					Description: `Set the length object names are abbreviated to. If unspecified or set to "auto", an appropriate value is computed based on the approximate number of packed objects in your repository, which hopefully is enough for abbreviated object names to stay unique for some time. If set to "no", no abbreviation is made and the object names are shown in their full length. The minimum length is 4`,
				}, {
					Name:        []string{`core.alternateRefsCommand`},
					Description: `When advertising tips of available history from an alternate, use the shell to execute the specified command instead of git-for-each-ref[1]. The first argument is the absolute path of the alternate. Output must contain one hex object id per line (i.e., the same as produced by "git for-each-ref --format='%(objectname)'")`,
				}, {
					Name:        []string{`core.alternateRefsPrefixes`},
					Description: `When listing references from an alternate, list only references that begin with the given prefix. Prefixes match as if they were given as arguments to git-for-each-ref[1]. To list multiple prefixes, separate them with whitespace. If "core.alternateRefsCommand" is set, setting "core.alternateRefsPrefixes" has no effect`,
				}, {
					Name:        []string{`core.askPass`},
					Description: `Some commands (e.g. svn and http interfaces) that interactively ask for a password can be told to use an external program given via the value of this variable. Can be overridden by the "GIT_ASKPASS" environment variable. If not set, fall back to the value of the "SSH_ASKPASS" environment variable or, failing that, a simple password prompt. The external program shall be given a suitable prompt as command-line argument and write the password on its STDOUT`,
				}, {
					Name:        []string{`core.attributesFile`},
					Description: `In addition to ".gitattributes" (per-directory) and ".git/info/attributes", Git looks into this file for attributes (see gitattributes[5]). Path expansions are made the same way as for "core.excludesFile". Its default value is "$XDG_CONFIG_HOME/git/attributes". If "$XDG_CONFIG_HOME" is either not set or empty, "$HOME/.config/git/attributes" is used instead`,
				}, {
					Name:        []string{`core.autocrlf`},
					Description: `Setting this variable to "true" is the same as setting the "text" attribute to "auto" on all files and core.eol to "crlf". Set to true if you want to have "CRLF" line endings in your working directory and the repository has LF line endings. This variable can be set to 'input', in which case no output conversion is performed`,
				}, {
					Name:        []string{`core.bare`},
					Description: `If true this repository is assumed to be 'bare' and has no working directory associated with it. If this is the case a number of commands that require a working directory will be disabled, such as git-add[1] or git-merge[1]`,
				}, {
					Name:        []string{`core.bigFileThreshold`},
					Description: `The size of files considered "big", which as discussed below changes the behavior of numerous git commands, as well as how such files are stored within the repository. The default is 512 MiB. Common unit suffixes of 'k', 'm', or 'g' are supported`,
				}, {
					Name:        []string{`core.checkRoundtripEncoding`},
					Description: `A comma and/or whitespace separated list of encodings that Git performs UTF-8 round trip checks on if they are used in an "working-tree-encoding" attribute (see gitattributes[5]). The default value is "SHIFT-JIS"`,
				}, {
					Name:        []string{`core.checkStat`},
					Description: `When missing or is set to "default", many fields in the stat structure are checked to detect if a file has been modified since Git looked at it. When this configuration variable is set to "minimal", sub-second part of mtime and ctime, the uid and gid of the owner of the file, the inode number (and the device number, if Git was compiled to use it), are excluded from the check among these fields, leaving only the whole-second part of mtime (and ctime, if "core.trustCtime" is set) and the filesize to be checked`,
				}, {
					Name:        []string{`core.commentChar`},
					Description: `Commands such as "commit" and "tag" that let you edit messages consider a line that begins with this character commented, and removes them after the editor returns (default '#')`,
				}, {
					Name:        []string{`core.commitGraph`},
					Description: `If true, then git will read the commit-graph file (if it exists) to parse the graph structure of commits. Defaults to true. See git-commit-graph[1] for more information`,
				}, {
					Name:        []string{`core.compression`},
					Description: `An integer -1..9, indicating a default compression level. -1 is the zlib default. 0 means no compression, and 1..9 are various speed/size tradeoffs, 9 being slowest. If set, this provides a default to other compression variables, such as "core.looseCompression" and "pack.compression"`,
				}, {
					Name:        []string{`core.createObject`},
					Description: `You can set this to 'link', in which case a hardlink followed by a delete of the source are used to make sure that object creation will not overwrite existing objects`,
				}, {
					Name:        []string{`core.deltaBaseCacheLimit`},
					Description: `Maximum number of bytes per thread to reserve for caching base objects that may be referenced by multiple deltified objects. By storing the entire decompressed base objects in a cache Git is able to avoid unpacking and decompressing frequently used base objects multiple times`,
				}, {
					Name:        []string{`core.editor`},
					Description: `Commands such as "commit" and "tag" that let you edit messages by launching an editor use the value of this variable when it is set, and the environment variable "GIT_EDITOR" is not set. See git-var[1]`,
				}, {
					Name:        []string{`core.eol`},
					Description: `Sets the line ending type to use in the working directory for files that are marked as text (either by having the "text" attribute set, or by having "text=auto" and Git auto-detecting the contents as text). Alternatives are 'lf', 'crlf' and 'native', which uses the platform's native line ending. The default value is "native". See gitattributes[5] for more information on end-of-line conversion. Note that this value is ignored if "core.autocrlf" is set to "true" or "input"`,
				}, {
					Name:        []string{`core.excludesFile`},
					Description: `Specifies the pathname to the file that contains patterns to describe paths that are not meant to be tracked, in addition to ".gitignore" (per-directory) and ".git/info/exclude". Defaults to "$XDG_CONFIG_HOME/git/ignore". If "$XDG_CONFIG_HOME" is either not set or empty, "$HOME/.config/git/ignore" is used instead. See gitignore[5]`,
				}, {
					Name:        []string{`core.fileMode`},
					Description: `Tells Git if the executable bit of files in the working tree is to be honored`,
				}, {
					Name:        []string{`core.filesRefLockTimeout`},
					Description: `The length of time, in milliseconds, to retry when trying to lock an individual reference. Value 0 means not to retry at all; -1 means to try indefinitely. Default is 100 (i.e., retry for 100ms)`,
				}, {
					Name:        []string{`core.fsmonitor`},
					Description: `If set to true, enable the built-in file system monitor daemon for this working directory (git-fsmonitor{litdd}daemon[1])`,
				}, {
					Name:        []string{`core.fsmonitorHookVersion`},
					Description: `Sets the protocol version to be used when invoking the "fsmonitor" hook`,
				}, {
					Name:        []string{`core.fsync`},
					Description: `A comma-separated list of components of the repository that should be hardened via the core.fsyncMethod when created or modified. You can disable hardening of any component by prefixing it with a '-'. Items that are not hardened may be lost in the event of an unclean system shutdown. Unless you have special requirements, it is recommended that you leave this option empty or pick one of "committed", "added", or "all"`,
				}, {
					Name:        []string{`core.fsyncMethod`},
					Description: `A value indicating the strategy Git will use to harden repository data using fsync and related primitives`,
				}, {
					Name:        []string{`core.fsyncObjectFiles`},
					Description: `This boolean will enable 'fsync()' when writing object files. This setting is deprecated. Use core.fsync instead`,
				}, {
					Name:        []string{`core.gitProxy`},
					Description: `A "proxy command" to execute (as 'command host port') instead of establishing direct connection to the remote server when using the Git protocol for fetching. If the variable value is in the "COMMAND for DOMAIN" format, the command is applied only on hostnames ending with the specified domain string. This variable may be set multiple times and is matched in the given order; the first match wins`,
				}, {
					Name:        []string{`core.hideDotFiles`},
					Description: `(Windows-only) If true, mark newly-created directories and files whose name starts with a dot as hidden. If 'dotGitOnly', only the ".git/" directory is hidden, but no other files starting with a dot. The default mode is 'dotGitOnly'`,
				}, {
					Name:        []string{`core.hooksPath`},
					Description: `By default Git will look for your hooks in the "$GIT_DIR/hooks" directory. Set this to different path, e.g. "/etc/git/hooks", and Git will try to find your hooks in that directory, e.g. "/etc/git/hooks/pre-receive" instead of in "$GIT_DIR/hooks/pre-receive"`,
				}, {
					Name:        []string{`core.ignoreCase`},
					Description: `Internal variable which enables various workarounds to enable Git to work better on filesystems that are not case sensitive, like APFS, HFS+, FAT, NTFS, etc. For example, if a directory listing finds "makefile" when Git expects "Makefile", Git will assume it is really the same file, and continue to remember it as "Makefile"`,
				}, {
					Name:        []string{`core.ignoreStat`},
					Description: `If true, Git will avoid using lstat() calls to detect if files have changed by setting the "assume-unchanged" bit for those tracked files which it has updated identically in both the index and working tree`,
				}, {
					Name:        []string{`core.logAllRefUpdates`},
					Description: `Enable the reflog. Updates to a ref <ref> is logged to the file ""$GIT_DIR/logs/<ref>"", by appending the new and old SHA-1, the date/time and the reason of the update, but only when the file exists. If this configuration variable is set to "true", missing ""$GIT_DIR/logs/<ref>"" file is automatically created for branch heads (i.e. under "refs/heads/"), remote refs (i.e. under "refs/remotes/"), note refs (i.e. under "refs/notes/"), and the symbolic ref "HEAD". If it is set to "always", then a missing reflog is automatically created for any ref under "refs/"`,
				}, {
					Name:        []string{`core.looseCompression`},
					Description: `An integer -1..9, indicating the compression level for objects that are not in a pack file. -1 is the zlib default. 0 means no compression, and 1..9 are various speed/size tradeoffs, 9 being slowest. If not set, defaults to core.compression. If that is not set, defaults to 1 (best speed)`,
				}, {
					Name:        []string{`core.multiPackIndex`},
					Description: `Use the multi-pack-index file to track multiple packfiles using a single index. See git-multi-pack-index[1] for more information. Defaults to true`,
				}, {
					Name:        []string{`core.notesRef`},
					Description: `When showing commit messages, also show notes which are stored in the given ref. The ref must be fully qualified. If the given ref does not exist, it is not an error but means that no notes should be printed`,
				}, {
					Name:        []string{`core.packedGitLimit`},
					Description: `Maximum number of bytes to map simultaneously into memory from pack files. If Git needs to access more than this many bytes at once to complete an operation it will unmap existing regions to reclaim virtual address space within the process`,
				}, {
					Name:        []string{`core.packedGitWindowSize`},
					Description: `Number of bytes of a pack file to map into memory in a single mapping operation. Larger window sizes may allow your system to process a smaller number of large pack files more quickly. Smaller window sizes will negatively affect performance due to increased calls to the operating system's memory manager, but may improve performance when accessing a large number of large pack files`,
				}, {
					Name:        []string{`core.packedRefsTimeout`},
					Description: `The length of time, in milliseconds, to retry when trying to lock the "packed-refs" file. Value 0 means not to retry at all; -1 means to try indefinitely. Default is 1000 (i.e., retry for 1 second)`,
				}, {
					Name:        []string{`core.pager`},
					Description: `Text viewer for use by Git commands (e.g., 'less'). The value is meant to be interpreted by the shell. The order of preference is the "$GIT_PAGER" environment variable, then "core.pager" configuration, then "$PAGER", and then the default chosen at compile time (usually 'less')`,
				}, {
					Name:        []string{`core.precomposeUnicode`},
					Description: `This option is only used by Mac OS implementation of Git. When core.precomposeUnicode=true, Git reverts the unicode decomposition of filenames done by Mac OS. This is useful when sharing a repository between Mac OS and Linux or Windows. (Git for Windows 1.7.10 or higher is needed, or Git under cygwin 1.7). When false, file names are handled fully transparent by Git, which is backward compatible with older versions of Git`,
				}, {
					Name:        []string{`core.preferSymlinkRefs`},
					Description: `Instead of the default "symref" format for HEAD and other symbolic reference files, use symbolic links. This is sometimes needed to work with old scripts that expect HEAD to be a symbolic link`,
				}, {
					Name:        []string{`core.preloadIndex`},
					Description: `Enable parallel index preload for operations like 'git diff'`,
				}, {
					Name:        []string{`core.protectHFS`},
					Description: `If set to true, do not allow checkout of paths that would be considered equivalent to ".git" on an HFS+ filesystem. Defaults to "true" on Mac OS, and "false" elsewhere`,
				}, {
					Name:        []string{`core.protectNTFS`},
					Description: `If set to true, do not allow checkout of paths that would cause problems with the NTFS filesystem, e.g. conflict with 8.3 "short" names. Defaults to "true" on Windows, and "false" elsewhere`,
				}, {
					Name:        []string{`core.quotePath`},
					Description: `Commands that output paths (e.g. 'ls-files', 'diff'), will quote "unusual" characters in the pathname by enclosing the pathname in double-quotes and escaping those characters with backslashes in the same way C escapes control characters (e.g. "\\t" for TAB, "\\n" for LF, "\\\\" for backslash) or bytes with values larger than 0x80 (e.g. octal "\302\265" for "micro" in UTF-8). If this variable is set to false, bytes higher than 0x80 are not considered "unusual" any more. Double-quotes, backslash and control characters are always escaped regardless of the setting of this variable. A simple space character is not considered "unusual". Many commands can output pathnames completely verbatim using the "-z" option. The default value is true`,
				}, {
					Name:        []string{`core.repositoryFormatVersion`},
					Description: `Internal variable identifying the repository format and layout version`,
				}, {
					Name:        []string{`core.restrictinheritedhandles`},
					Description: `Windows-only: override whether spawned processes inherit only standard file handles ("stdin", "stdout" and "stderr") or all handles. Can be "auto", "true" or "false". Defaults to "auto", which means "true" on Windows 7 and later, and "false" on older Windows versions`,
				}, {
					Name:        []string{`core.safecrlf`},
					Description: `If true, makes Git check if converting "CRLF" is reversible when end-of-line conversion is active. Git will verify if a command modifies a file in the work tree either directly or indirectly. For example, committing a file followed by checking out the same file should yield the original file in the work tree. If this is not the case for the current setting of "core.autocrlf", Git will reject the file. The variable can be set to "warn", in which case Git will only warn about an irreversible conversion but continue the operation`,
				}, {
					Name:        []string{`core.sharedRepository`},
					Description: `When 'group' (or 'true'), the repository is made shareable between several users in a group (making sure all the files and objects are group-writable). When 'all' (or 'world' or 'everybody'), the repository will be readable by all users, additionally to being group-shareable. When 'umask' (or 'false'), Git will use permissions reported by umask(2). When '0xxx', where '0xxx' is an octal number, files in the repository will have this mode value. '0xxx' will override user's umask value (whereas the other options will only override requested parts of the user's umask value). Examples: '0660' will make the repo read/write-able for the owner and group, but inaccessible to others (equivalent to 'group' unless umask is e.g. '0022'). '0640' is a repository that is group-readable but not group-writable. See git-init[1]. False by default`,
				}, {
					Name:        []string{`core.sparseCheckout`},
					Description: `Enable "sparse checkout" feature. See git-sparse-checkout[1] for more information`,
				}, {
					Name:        []string{`core.sparseCheckoutCone`},
					Description: `Enables the "cone mode" of the sparse checkout feature. When the sparse-checkout file contains a limited set of patterns, this mode provides significant performance advantages. The "non-cone mode" can be requested to allow specifying more flexible patterns by setting this variable to 'false'. See git-sparse-checkout[1] for more information`,
				}, {
					Name:        []string{`core.splitIndex`},
					Description: `If true, the split-index feature of the index will be used. See git-update-index[1]. False by default`,
				}, {
					Name:        []string{`core.sshCommand`},
					Description: `If this variable is set, "git fetch" and "git push" will use the specified command instead of "ssh" when they need to connect to a remote system. The command is in the same form as the "GIT_SSH_COMMAND" environment variable and is overridden when the environment variable is set`,
				}, {
					Name:        []string{`core.symlinks`},
					Description: `If false, symbolic links are checked out as small plain files that contain the link text. git-update-index[1] and git-add[1] will not change the recorded type to regular file. Useful on filesystems like FAT that do not support symbolic links`,
				}, {
					Name:        []string{`core.trustctime`},
					Description: `If false, the ctime differences between the index and the working tree are ignored; useful when the inode change time is regularly modified by something outside Git (file system crawlers and some backup systems). See git-update-index[1]. True by default`,
				}, {
					Name:        []string{`core.unsetenvvars`},
					Description: `Windows-only: comma-separated list of environment variables' names that need to be unset before spawning any other process. Defaults to "PERL5LIB" to account for the fact that Git for Windows insists on using its own Perl interpreter`,
				}, {
					Name:        []string{`core.untrackedCache`},
					Description: `Determines what to do about the untracked cache feature of the index. It will be kept, if this variable is unset or set to "keep". It will automatically be added if set to "true". And it will automatically be removed, if set to "false". Before setting it to "true", you should check that mtime is working properly on your system. See git-update-index[1]. "keep" by default, unless "feature.manyFiles" is enabled which sets this setting to "true" by default`,
				}, {
					Name:        []string{`core.useReplaceRefs`},
					Description: `If set to "false", behave as if the "--no-replace-objects" option was given on the command line. See git[1] and git-replace[1] for more information`,
				}, {
					Name:        []string{`core.warnAmbiguousRefs`},
					Description: `If true, Git will warn you if the ref name you passed it is ambiguous and might match multiple refs in the repository. True by default`,
				}, {
					Name:        []string{`core.whitespace`},
					Description: `A comma separated list of common whitespace problems to notice. 'git diff' will use "color.diff.whitespace" to highlight them, and 'git apply --whitespace=error' will consider them as errors. You can prefix "-" to disable any of them (e.g. "-trailing-space"):`,
				}, {
					Name:        []string{`core.worktree`},
					Description: `Set the path to the root of the working tree. If "GIT_COMMON_DIR" environment variable is set, core.worktree is ignored and not used for determining the root of working tree. This can be overridden by the "GIT_WORK_TREE" environment variable and the "--work-tree" command-line option. The value can be an absolute path or relative to the path to the .git directory, which is either specified by --git-dir or GIT_DIR, or automatically discovered. If --git-dir or GIT_DIR is specified but none of --work-tree, GIT_WORK_TREE and core.worktree is specified, the current working directory is regarded as the top level of your working tree`,
				}, {
					Name:        []string{`credential.helper`},
					Description: `Specify an external helper to be called when a username or password credential is needed; the helper may consult external storage to avoid prompting the user for the credentials. This is normally the name of a credential helper with possible arguments, but may also be an absolute path with arguments or, if preceded by "!", shell commands`,
				}, {
					Name:        []string{`credential.useHttpPath`},
					Description: `When acquiring credentials, consider the "path" component of an http or https URL to be important. Defaults to false. See gitcredentials[7] for more information`,
				}, {
					Name:        []string{`credential.username`},
					Description: `If no username is set for a network authentication, use this username by default. See credential.<context>.* below, and gitcredentials[7]`,
				}, {
					Name:        []string{`credentialCache.ignoreSIGHUP`},
					Description: `Tell git-credential-cache--daemon to ignore SIGHUP, instead of quitting`,
				}, {
					Name:        []string{`credentialStore.lockTimeoutMS`},
					Description: `The length of time, in milliseconds, for git-credential-store to retry when trying to lock the credentials file. Value 0 means not to retry at all; -1 means to try indefinitely. Default is 1000 (i.e., retry for 1s)`,
				}, {
					Name:        []string{`credential.<url>.helper`},
					Description: `Specify an external helper to be called when a username or password credential is needed; the helper may consult external storage to avoid prompting the user for the credentials. This is normally the name of a credential helper with possible arguments, but may also be an absolute path with arguments or, if preceded by "!", shell commands`,
				}, {
					Name:        []string{`credential.<url>.useHttpPath`},
					Description: `When acquiring credentials, consider the "path" component of an http or https URL to be important. Defaults to false. See gitcredentials[7] for more information`,
				}, {
					Name:        []string{`credential.<url>.username`},
					Description: `If no username is set for a network authentication, use this username by default. See credential.<context>.* below, and gitcredentials[7]`,
				}, {
					Name:        []string{`credentialCache.<url>.ignoreSIGHUP`},
					Description: `Tell git-credential-cache--daemon to ignore SIGHUP, instead of quitting`,
				}, {
					Name:        []string{`credentialStore.<url>.lockTimeoutMS`},
					Description: `The length of time, in milliseconds, for git-credential-store to retry when trying to lock the credentials file. Value 0 means not to retry at all; -1 means to try indefinitely. Default is 1000 (i.e., retry for 1s)`,
				}, {
					Name:        []string{`diff.<driver>.binary`},
					Description: `Set this option to true to make the diff driver treat files as binary. See gitattributes[5] for details`,
				}, {
					Name:        []string{`diff.<driver>.cachetextconv`},
					Description: `Set this option to true to make the diff driver cache the text conversion outputs. See gitattributes[5] for details`,
				}, {
					Name:        []string{`diff.<driver>.command`},
					Description: `The custom diff driver command. See gitattributes[5] for details`,
				}, {
					Name:        []string{`diff.<driver>.textconv`},
					Description: `The command that the diff driver should call to generate the text-converted version of a file. The result of the conversion is used to generate a human-readable diff. See gitattributes[5] for details`,
				}, {
					Name:        []string{`diff.<driver>.wordRegex`},
					Description: `The regular expression that the diff driver should use to split words in a line. See gitattributes[5] for details`,
				}, {
					Name:        []string{`diff.<driver>.xfuncname`},
					Description: `The regular expression that the diff driver should use to recognize the hunk header. A built-in pattern may also be used. See gitattributes[5] for details`,
				}, {
					Name:        []string{`diff.algorithm`},
					Description: `Choose a diff algorithm`,
				}, {
					Name:        []string{`diff.autoRefreshIndex`},
					Description: `When using 'git diff' to compare with work tree files, do not consider stat-only change as changed. Instead, silently run "git update-index --refresh" to update the cached stat information for paths whose contents in the work tree match the contents in the index. This option defaults to true. Note that this affects only 'git diff' Porcelain, and not lower level 'diff' commands such as 'git diff-files'`,
				}, {
					Name:        []string{`diff.colorMoved`},
					Description: `If set to either a valid "<mode>" or a true value, moved lines in a diff are colored differently, for details of valid modes see '--color-moved' in git-diff[1]. If simply set to true the default color mode will be used. When set to false, moved lines are not colored`,
				}, {
					Name:        []string{`diff.colorMovedWS`},
					Description: `When moved lines are colored using e.g. the "diff.colorMoved" setting, this option controls the "<mode>" how spaces are treated for details of valid modes see '--color-moved-ws' in git-diff[1]`,
				}, {
					Name:        []string{`diff.context`},
					Description: `Generate diffs with <n> lines of context instead of the default of 3. This value is overridden by the -U option`,
				}, {
					Name:        []string{`diff.dirstat`},
					Description: `A comma separated list of "--dirstat" parameters specifying the default behavior of the "--dirstat" option to git-diff[1] and friends. The defaults can be overridden on the command line (using "--dirstat=<param1,param2,...>"). The fallback defaults (when not changed by "diff.dirstat") are "changes,noncumulative,3". The following parameters are available:`,
				}, {
					Name:        []string{`diff.external`},
					Description: `If this config variable is set, diff generation is not performed using the internal diff machinery, but using the given command. Can be overridden with the "GIT_EXTERNAL_DIFF' environment variable. The command is called with parameters as described under "git Diffs" in git[1]. Note: if you want to use an external diff program only on a subset of your files, you might want to use gitattributes[5] instead`,
				}, {
					Name:        []string{`diff.guitool`},
					Description: `Controls which diff tool is used by git-difftool[1] when the -g/--gui flag is specified. This variable overrides the value configured in "merge.guitool". The list below shows the valid built-in values. Any other value is treated as a custom diff tool and requires that a corresponding difftool.<guitool>.cmd variable is defined`,
				}, {
					Name:        []string{`diff.ignoreSubmodules`},
					Description: `Sets the default value of --ignore-submodules. Note that this affects only 'git diff' Porcelain, and not lower level 'diff' commands such as 'git diff-files'. 'git checkout' and 'git switch' also honor this setting when reporting uncommitted changes. Setting it to 'all' disables the submodule summary normally shown by 'git commit' and 'git status' when "status.submoduleSummary" is set unless it is overridden by using the --ignore-submodules command-line option. The 'git submodule' commands are not affected by this setting. By default this is set to untracked so that any untracked submodules are ignored`,
				}, {
					Name:        []string{`diff.indentHeuristic`},
					Description: `Set this option to "false" to disable the default heuristics that shift diff hunk boundaries to make patches easier to read`,
				}, {
					Name:        []string{`diff.interHunkContext`},
					Description: `Show the context between diff hunks, up to the specified number of lines, thereby fusing the hunks that are close to each other. This value serves as the default for the "--inter-hunk-context" command line option`,
				}, {
					Name:        []string{`diff.mnemonicPrefix`},
					Description: `If set, 'git diff' uses a prefix pair that is different from the standard "a/" and "b/" depending on what is being compared. When this configuration is in effect, reverse diff output also swaps the order of the prefixes:`,
				}, {
					Name:        []string{`diff.noprefix`},
					Description: `If set, 'git diff' does not show any source or destination prefix`,
				}, {
					Name:        []string{`diff.orderFile`},
					Description: `File indicating how to order files within a diff. See the '-O' option to git-diff[1] for details. If "diff.orderFile" is a relative pathname, it is treated as relative to the top of the working tree`,
				}, {
					Name:        []string{`diff.relative`},
					Description: `If set to 'true', 'git diff' does not show changes outside of the directory and show pathnames relative to the current directory`,
				}, {
					Name:        []string{`diff.renameLimit`},
					Description: `The number of files to consider in the exhaustive portion of copy/rename detection; equivalent to the 'git diff' option "-l". If not set, the default value is currently 1000. This setting has no effect if rename detection is turned off`,
				}, {
					Name:        []string{`diff.renames`},
					Description: `Whether and how Git detects renames. If set to "false", rename detection is disabled. If set to "true", basic rename detection is enabled. If set to "copies" or "copy", Git will detect copies, as well. Defaults to true. Note that this affects only 'git diff' Porcelain like git-diff[1] and git-log[1], and not lower level commands such as git-diff-files[1]`,
				}, {
					Name:        []string{`diff.statGraphWidth`},
					Description: `Limit the width of the graph part in --stat output. If set, applies to all commands generating --stat output except format-patch`,
				}, {
					Name:        []string{`diff.submodule`},
					Description: `Specify the format in which differences in submodules are shown. The "short" format just shows the names of the commits at the beginning and end of the range. The "log" format lists the commits in the range like git-submodule[1] "summary" does. The "diff" format shows an inline diff of the changed contents of the submodule. Defaults to "short"`,
				}, {
					Name:        []string{`diff.suppressBlankEmpty`},
					Description: `A boolean to inhibit the standard behavior of printing a space before each empty output line. Defaults to false`,
				}, {
					Name:        []string{`diff.tool`},
					Description: `Controls which diff tool is used by git-difftool[1]. This variable overrides the value configured in "merge.tool". The list below shows the valid built-in values. Any other value is treated as a custom diff tool and requires that a corresponding difftool.<tool>.cmd variable is defined`,
				}, {
					Name:        []string{`diff.wordRegex`},
					Description: `A POSIX Extended Regular Expression used to determine what is a "word" when performing word-by-word difference calculations. Character sequences that match the regular expression are "words", all other characters are *ignorable* whitespace`,
				}, {
					Name:        []string{`diff.wsErrorHighlight`},
					Description: `Highlight whitespace errors in the "context", "old" or "new" lines of the diff. Multiple values are separated by comma, "none" resets previous values, "default" reset the list to "new" and "all" is a shorthand for "old,new,context". The whitespace errors are colored with "color.diff.whitespace". The command line option "--ws-error-highlight=<kind>" overrides this setting`,
				}, {
					Name:        []string{`difftool.<tool>.cmd`},
					Description: `Specify the command to invoke the specified diff tool. The specified command is evaluated in shell with the following variables available: 'LOCAL' is set to the name of the temporary file containing the contents of the diff pre-image and 'REMOTE' is set to the name of the temporary file containing the contents of the diff post-image`,
				}, {
					Name:        []string{`difftool.<tool>.path`},
					Description: `Override the path for the given tool. This is useful in case your tool is not in the PATH`,
				}, {
					Name:        []string{`difftool.prompt`},
					Description: `Prompt before each invocation of the diff tool`,
				}, {
					Name:        []string{`extensions.objectFormat`},
					Description: `Specify the hash algorithm to use. The acceptable values are "sha1" and "sha256". If not specified, "sha1" is assumed. It is an error to specify this key unless "core.repositoryFormatVersion" is 1`,
				}, {
					Name:        []string{`extensions.worktreeConfig`},
					Description: `If enabled, then worktrees will load config settings from the "$GIT_DIR/config.worktree" file in addition to the "$GIT_COMMON_DIR/config" file. Note that "$GIT_COMMON_DIR" and "$GIT_DIR" are the same for the main working tree, while other working trees have "$GIT_DIR" equal to "$GIT_COMMON_DIR/worktrees/<id>/". The settings in the "config.worktree" file will override settings from any other config files`,
				}, {
					Name:        []string{`fastimport.unpackLimit`},
					Description: `If the number of objects imported by git-fast-import[1] is below this limit, then the objects will be unpacked into loose object files. However if the number of imported objects equals or exceeds this limit then the pack will be stored as a pack. Storing the pack from a fast-import can make the import operation complete faster, especially on slow filesystems. If not set, the value of "transfer.unpackLimit" is used instead`,
				}, {
					Name:        []string{`feature.*`},
					Description: `The config settings that start with "feature." modify the defaults of a group of other config settings. These groups are created by the Git developer community as recommended defaults and are subject to change. In particular, new config options may be added with different defaults`,
				}, {
					Name:        []string{`feature.experimental`},
					Description: `Enable config options that are new to Git, and are being considered for future defaults. Config settings included here may be added or removed with each release, including minor version updates. These settings may have unintended interactions since they are so new. Please enable this setting if you are interested in providing feedback on experimental features. The new default values are:`,
				}, {
					Name:        []string{`feature.manyFiles`},
					Description: `Enable config options that optimize for repos with many files in the working directory. With many files, commands such as "git status" and "git checkout" may be slow and these new defaults improve performance:`,
				}, {
					Name:        []string{`fetch.fsck.<msg-id>`},
					Description: `Acts like "fsck.<msg-id>", but is used by git-fetch-pack[1] instead of git-fsck[1]. See the "fsck.<msg-id>" documentation for details`,
				}, {
					Name:        []string{`fetch.fsck.skipList`},
					Description: `Acts like "fsck.skipList", but is used by git-fetch-pack[1] instead of git-fsck[1]. See the "fsck.skipList" documentation for details`,
				}, {
					Name:        []string{`fetch.fsckObjects`},
					Description: `If it is set to true, git-fetch-pack will check all fetched objects. See "transfer.fsckObjects" for what's checked. Defaults to false. If not set, the value of "transfer.fsckObjects" is used instead`,
				}, {
					Name:        []string{`fetch.negotiationAlgorithm`},
					Description: `Control how information about the commits in the local repository is sent when negotiating the contents of the packfile to be sent by the server. Set to "consecutive" to use an algorithm that walks over consecutive commits checking each one. Set to "skipping" to use an algorithm that skips commits in an effort to converge faster, but may result in a larger-than-necessary packfile; or set to "noop" to not send any information at all, which will almost certainly result in a larger-than-necessary packfile, but will skip the negotiation step. Set to "default" to override settings made previously and use the default behaviour. The default is normally "consecutive", but if "feature.experimental" is true, then the default is "skipping". Unknown values will cause 'git fetch' to error out`,
				}, {
					Name:        []string{`fetch.output`},
					Description: `Control how ref update status is printed. Valid values are "full" and "compact". Default value is "full". See section OUTPUT in git-fetch[1] for detail`,
				}, {
					Name:        []string{`fetch.parallel`},
					Description: `Specifies the maximal number of fetch operations to be run in parallel at a time (submodules, or remotes when the "--multiple" option of git-fetch[1] is in effect)`,
				}, {
					Name:        []string{`fetch.prune`},
					Description: `If true, fetch will automatically behave as if the "--prune" option was given on the command line. See also "remote.<name>.prune" and the PRUNING section of git-fetch[1]`,
				}, {
					Name:        []string{`fetch.pruneTags`},
					Description: `If true, fetch will automatically behave as if the "refs/tags/*:refs/tags/*" refspec was provided when pruning, if not set already. This allows for setting both this option and "fetch.prune" to maintain a 1=1 mapping to upstream refs. See also "remote.<name>.pruneTags" and the PRUNING section of git-fetch[1]`,
				}, {
					Name:        []string{`fetch.recurseSubmodules`},
					Description: `This option controls whether "git fetch" (and the underlying fetch in "git pull") will recursively fetch into populated submodules. This option can be set either to a boolean value or to 'on-demand'. Setting it to a boolean changes the behavior of fetch and pull to recurse unconditionally into submodules when set to true or to not recurse at all when set to false. When set to 'on-demand', fetch and pull will only recurse into a populated submodule when its superproject retrieves a commit that updates the submodule's reference. Defaults to 'on-demand', or to the value of 'submodule.recurse' if set`,
				}, {
					Name:        []string{`fetch.showForcedUpdates`},
					Description: `Set to false to enable "--no-show-forced-updates" in git-fetch[1] and git-pull[1] commands. Defaults to true`,
				}, {
					Name:        []string{`fetch.unpackLimit`},
					Description: `If the number of objects fetched over the Git native transfer is below this limit, then the objects will be unpacked into loose object files. However if the number of received objects equals or exceeds this limit then the received pack will be stored as a pack, after adding any missing delta bases. Storing the pack from a push can make the push operation complete faster, especially on slow filesystems. If not set, the value of "transfer.unpackLimit" is used instead`,
				}, {
					Name:        []string{`fetch.writeCommitGraph`},
					Description: `Set to true to write a commit-graph after every "git fetch" command that downloads a pack-file from a remote. Using the "--split" option, most executions will create a very small commit-graph file on top of the existing commit-graph file(s). Occasionally, these files will merge and the write may take longer. Having an updated commit-graph file helps performance of many Git commands, including "git merge-base", "git push -f", and "git log --graph". Defaults to false`,
				}, {
					Name:        []string{`filter.<driver>.clean`},
					Description: `The command which is used to convert the content of a worktree file to a blob upon checkin. See gitattributes[5] for details`,
				}, {
					Name:        []string{`filter.<driver>.smudge`},
					Description: `The command which is used to convert the content of a blob object to a worktree file upon checkout. See gitattributes[5] for details`,
				}, {
					Name:        []string{`format.attach`},
					Description: `Enable multipart/mixed attachments as the default for 'format-patch'. The value can also be a double quoted string which will enable attachments as the default and set the value as the boundary. See the --attach option in git-format-patch[1]`,
				}, {
					Name:        []string{`format.cc`},
					Description: `Additional recipients to include in a patch to be submitted by mail. See the --to and --cc options in git-format-patch[1]`,
				}, {
					Name:        []string{`format.coverFromDescription`},
					Description: `The default mode for format-patch to determine which parts of the cover letter will be populated using the branch's description. See the "--cover-from-description" option in git-format-patch[1]`,
				}, {
					Name:        []string{`format.coverLetter`},
					Description: `A boolean that controls whether to generate a cover-letter when format-patch is invoked, but in addition can be set to "auto", to generate a cover-letter only when there's more than one patch. Default is false`,
				}, {
					Name:        []string{`format.encodeEmailHeaders`},
					Description: `Encode email headers that have non-ASCII characters with "Q-encoding" (described in RFC 2047) for email transmission. Defaults to true`,
				}, {
					Name:        []string{`format.filenameMaxLength`},
					Description: `The maximum length of the output filenames generated by the "format-patch" command; defaults to 64. Can be overridden by the "--filename-max-length=<n>" command line option`,
				}, {
					Name:        []string{`format.from`},
					Description: `Provides the default value for the "--from" option to format-patch. Accepts a boolean value, or a name and email address. If false, format-patch defaults to "--no-from", using commit authors directly in the "From:" field of patch mails. If true, format-patch defaults to "--from", using your committer identity in the "From:" field of patch mails and including a "From:" field in the body of the patch mail if different. If set to a non-boolean value, format-patch uses that value instead of your committer identity. Defaults to false`,
				}, {
					Name:        []string{`format.headers`},
					Description: `Additional email headers to include in a patch to be submitted by mail. See git-format-patch[1]`,
				}, {
					Name:        []string{`format.notes`},
					Description: `Provides the default value for the "--notes" option to format-patch. Accepts a boolean value, or a ref which specifies where to get notes. If false, format-patch defaults to "--no-notes". If true, format-patch defaults to "--notes". If set to a non-boolean value, format-patch defaults to "--notes=<ref>", where "ref" is the non-boolean value. Defaults to false`,
				}, {
					Name:        []string{`format.numbered`},
					Description: `A boolean which can enable or disable sequence numbers in patch subjects. It defaults to "auto" which enables it only if there is more than one patch. It can be enabled or disabled for all messages by setting it to "true" or "false". See --numbered option in git-format-patch[1]`,
				}, {
					Name:        []string{`format.outputDirectory`},
					Description: `Set a custom directory to store the resulting files instead of the current working directory. All directory components will be created`,
				}, {
					Name:        []string{`format.pretty`},
					Description: `The default pretty format for log/show/whatchanged command, See git-log[1], git-show[1], git-whatchanged[1]`,
				}, {
					Name:        []string{`format.signature`},
					Description: `The default for format-patch is to output a signature containing the Git version number. Use this variable to change that default. Set this variable to the empty string ("") to suppress signature generation`,
				}, {
					Name:        []string{`format.signatureFile`},
					Description: `Works just like format.signature except the contents of the file specified by this variable will be used as the signature`,
				}, {
					Name:        []string{`format.signOff`},
					Description: `A boolean value which lets you enable the "-s/--signoff" option of format-patch by default. *Note:* Adding the "Signed-off-by" trailer to a patch should be a conscious act and means that you certify you have the rights to submit this work under the same open source license. Please see the 'SubmittingPatches' document for further discussion`,
				}, {
					Name:        []string{`format.subjectPrefix`},
					Description: `The default for format-patch is to output files with the '[PATCH]' subject prefix. Use this variable to change that prefix`,
				}, {
					Name:        []string{`format.suffix`},
					Description: `The default for format-patch is to output files with the suffix ".patch". Use this variable to change that suffix (make sure to include the dot if you want it)`,
				}, {
					Name:        []string{`format.thread`},
					Description: `The default threading style for 'git format-patch'. Can be a boolean value, or "shallow" or "deep". "shallow" threading makes every mail a reply to the head of the series, where the head is chosen from the cover letter, the "--in-reply-to", and the first patch mail, in this order. "deep" threading makes every mail a reply to the previous one. A true boolean value is the same as "shallow", and a false value disables threading`,
				}, {
					Name:        []string{`format.useAutoBase`},
					Description: `A boolean value which lets you enable the "--base=auto" option of format-patch by default. Can also be set to "whenAble" to allow enabling "--base=auto" if a suitable base is available, but to skip adding base info otherwise without the format dying`,
				}, {
					Name:        []string{`fsck.<msg-id>`},
					Description: `During fsck git may find issues with legacy data which wouldn't be generated by current versions of git, and which wouldn't be sent over the wire if "transfer.fsckObjects" was set. This feature is intended to support working with legacy repositories containing such data`,
				}, {
					Name:        []string{`fsck.skipList`},
					Description: `The path to a list of object names (i.e. one unabbreviated SHA-1 per line) that are known to be broken in a non-fatal way and should be ignored. On versions of Git 2.20 and later comments ('#'), empty lines, and any leading and trailing whitespace is ignored. Everything but a SHA-1 per line will error out on older versions`,
				}, {
					Name:        []string{`gc.<pattern>.reflogExpire`},
					Description: `'git reflog expire' removes reflog entries older than this time; defaults to 90 days. The value "now" expires all entries immediately, and "never" suppresses expiration altogether. With "<pattern>" (e.g. "refs/stash") in the middle the setting applies only to the refs that match the <pattern>`,
				}, {
					Name:        []string{`gc.<pattern>.reflogExpireUnreachable`},
					Description: `'git reflog expire' removes reflog entries older than this time and are not reachable from the current tip; defaults to 30 days. The value "now" expires all entries immediately, and "never" suppresses expiration altogether. With "<pattern>" (e.g. "refs/stash") in the middle, the setting applies only to the refs that match the <pattern>`,
				}, {
					Name:        []string{`gc.aggressiveDepth`},
					Description: `The depth parameter used in the delta compression algorithm used by 'git gc --aggressive'. This defaults to 50, which is the default for the "--depth" option when "--aggressive" isn't in use`,
				}, {
					Name:        []string{`gc.aggressiveWindow`},
					Description: `The window size parameter used in the delta compression algorithm used by 'git gc --aggressive'. This defaults to 250, which is a much more aggressive window size than the default "--window" of 10`,
				}, {
					Name:        []string{`gc.auto`},
					Description: `When there are approximately more than this many loose objects in the repository, "git gc --auto" will pack them. Some Porcelain commands use this command to perform a light-weight garbage collection from time to time. The default value is 6700`,
				}, {
					Name:        []string{`gc.autoDetach`},
					Description: `Make "git gc --auto" return immediately and run in background if the system supports it. Default is true`,
				}, {
					Name:        []string{`gc.autoPackLimit`},
					Description: `When there are more than this many packs that are not marked with "*.keep" file in the repository, "git gc --auto" consolidates them into one larger pack. The default value is 50. Setting this to 0 disables it. Setting "gc.auto" to 0 will also disable this`,
				}, {
					Name:        []string{`gc.bigPackThreshold`},
					Description: `If non-zero, all packs larger than this limit are kept when "git gc" is run. This is very similar to "--keep-largest-pack" except that all packs that meet the threshold are kept, not just the largest pack. Defaults to zero. Common unit suffixes of 'k', 'm', or 'g' are supported`,
				}, {
					Name:        []string{`gc.cruftPacks`},
					Description: `Store unreachable objects in a cruft pack (see git-repack[1]) instead of as loose objects. The default is "false"`,
				}, {
					Name:        []string{`gc.logExpiry`},
					Description: `If the file gc.log exists, then "git gc --auto" will print its content and exit with status zero instead of running unless that file is more than 'gc.logExpiry' old. Default is "1.day". See "gc.pruneExpire" for more ways to specify its value`,
				}, {
					Name:        []string{`gc.packRefs`},
					Description: `Running "git pack-refs" in a repository renders it unclonable by Git versions prior to 1.5.1.2 over dumb transports such as HTTP. This variable determines whether 'git gc' runs "git pack-refs". This can be set to "notbare" to enable it within all non-bare repos or it can be set to a boolean value. The default is "true"`,
				}, {
					Name:        []string{`gc.pruneExpire`},
					Description: `When 'git gc' is run, it will call 'prune --expire 2.weeks.ago' (and 'repack --cruft --cruft-expiration 2.weeks.ago' if using cruft packs via "gc.cruftPacks" or "--cruft"). Override the grace period with this config variable. The value "now" may be used to disable this grace period and always prune unreachable objects immediately, or "never" may be used to suppress pruning. This feature helps prevent corruption when 'git gc' runs concurrently with another process writing to the repository; see the "NOTES" section of git-gc[1]`,
				}, {
					Name:        []string{`gc.rerereResolved`},
					Description: `Records of conflicted merge you resolved earlier are kept for this many days when 'git rerere gc' is run. You can also use more human-readable "1.month.ago", etc. The default is 60 days. See git-rerere[1]`,
				}, {
					Name:        []string{`gc.rerereUnresolved`},
					Description: `Records of conflicted merge you have not resolved are kept for this many days when 'git rerere gc' is run. You can also use more human-readable "1.month.ago", etc. The default is 15 days. See git-rerere[1]`,
				}, {
					Name:        []string{`gc.worktreePruneExpire`},
					Description: `When 'git gc' is run, it calls 'git worktree prune --expire 3.months.ago'. This config variable can be used to set a different grace period. The value "now" may be used to disable the grace period and prune "$GIT_DIR/worktrees" immediately, or "never" may be used to suppress pruning`,
				}, {
					Name:        []string{`gc.writeCommitGraph`},
					Description: `If true, then gc will rewrite the commit-graph file when git-gc[1] is run. When using "git gc --auto" the commit-graph will be updated if housekeeping is required. Default is true. See git-commit-graph[1] for details`,
				}, {
					Name:        []string{`gitcvs.allBinary`},
					Description: `This is used if "gitcvs.usecrlfattr" does not resolve the correct '-kb' mode to use. If true, all unresolved files are sent to the client in mode '-kb'. This causes the client to treat them as binary files, which suppresses any newline munging it otherwise might do. Alternatively, if it is set to "guess", then the contents of the file are examined to decide if it is binary, similar to "core.autocrlf"`,
				}, {
					Name:        []string{`gitcvs.commitMsgAnnotation`},
					Description: `Append this string to each commit message. Set to empty string to disable this feature. Defaults to "via git-CVS emulator"`,
				}, {
					Name:        []string{`gitcvs.dbDriver`},
					Description: `Used Perl DBI driver. You can specify any available driver for this here, but it might not work. git-cvsserver is tested with 'DBD::SQLite', reported to work with 'DBD::Pg', and reported *not* to work with 'DBD::mysql'. Experimental feature. May not contain double colons (":"). Default: 'SQLite'. See git-cvsserver[1]`,
				}, {
					Name:        []string{`gitcvs.dbName`},
					Description: `Database used by git-cvsserver to cache revision information derived from the Git repository. The exact meaning depends on the used database driver, for SQLite (which is the default driver) this is a filename. Supports variable substitution (see git-cvsserver[1] for details). May not contain semicolons (";"). Default: '%Ggitcvs.%m.sqlite'`,
				}, {
					Name:        []string{`gitcvs.dbTableNamePrefix`},
					Description: `Database table name prefix. Prepended to the names of any database tables used, allowing a single database to be used for several repositories. Supports variable substitution (see git-cvsserver[1] for details). Any non-alphabetic characters will be replaced with underscores`,
				}, {
					Name:        []string{`gitcvs.dbUser`},
					Description: `Database user and password. Only useful if setting "gitcvs.dbDriver", since SQLite has no concept of database users and/or passwords. 'gitcvs.dbUser' supports variable substitution (see git-cvsserver[1] for details)`,
				}, {
					Name:        []string{`gitcvs.enabled`},
					Description: `Whether the CVS server interface is enabled for this repository. See git-cvsserver[1]`,
				}, {
					Name:        []string{`gitcvs.logFile`},
					Description: `Path to a log file where the CVS server interface well... logs various stuff. See git-cvsserver[1]`,
				}, {
					Name:        []string{`gitcvs.usecrlfattr`},
					Description: `If true, the server will look up the end-of-line conversion attributes for files to determine the "-k" modes to use. If the attributes force Git to treat a file as text, the "-k" mode will be left blank so CVS clients will treat it as text. If they suppress text conversion, the file will be set with '-kb' mode, which suppresses any newline munging the client might otherwise do. If the attributes do not allow the file type to be determined, then "gitcvs.allBinary" is used. See gitattributes[5]`,
				}, {
					Name:        []string{`gitweb.snapshot`},
					Description: `See gitweb.conf[5] for description`,
				}, {
					Name:        []string{`gitweb.url`},
					Description: `See gitweb[1] for description`,
				}, {
					Name:        []string{`gpg.<format>.program`},
					Description: `Use this to customize the program used for the signing format you chose. (see "gpg.program" and "gpg.format") "gpg.program" can still be used as a legacy synonym for "gpg.openpgp.program". The default value for "gpg.x509.program" is "gpgsm" and "gpg.ssh.program" is "ssh-keygen"`,
				}, {
					Name:        []string{`gpg.format`},
					Description: `Specifies which key format to use when signing with "--gpg-sign". Default is "openpgp". Other possible values are "x509", "ssh"`,
				}, {
					Name:        []string{`gpg.minTrustLevel`},
					Description: `Specifies a minimum trust level for signature verification. If this option is unset, then signature verification for merge operations require a key with at least "marginal" trust. Other operations that perform signature verification require a key with at least "undefined" trust. Setting this option overrides the required trust-level for all operations. Supported values, in increasing order of significance:`,
				}, {
					Name:        []string{`gpg.program`},
					Description: `Use this custom program instead of ""gpg"" found on "$PATH" when making or verifying a PGP signature. The program must support the same command-line interface as GPG, namely, to verify a detached signature, ""gpg --verify $signature - <$file"" is run, and the program is expected to signal a good signature by exiting with code 0, and to generate an ASCII-armored detached signature, the standard input of ""gpg -bsau $key"" is fed with the contents to be signed, and the program is expected to send the result to its standard output`,
				}, {
					Name:        []string{`gpg.ssh.allowedSignersFile`},
					Description: `A file containing ssh public keys which you are willing to trust. The file consists of one or more lines of principals followed by an ssh public key. e.g.: "user1@example.com,user2@example.com ssh-rsa AAAAX1..." See ssh-keygen(1) "ALLOWED SIGNERS" for details. The principal is only used to identify the key and is available when verifying a signature`,
				}, {
					Name:        []string{`gpg.ssh.defaultKeyCommand`},
					Description: `This command that will be run when user.signingkey is not set and a ssh signature is requested. On successful exit a valid ssh public key prefixed with "key::" is expected in the first line of its output. This allows for a script doing a dynamic lookup of the correct public key when it is impractical to statically configure "user.signingKey". For example when keys or SSH Certificates are rotated frequently or selection of the right key depends on external factors unknown to git`,
				}, {
					Name:        []string{`gpg.ssh.revocationFile`},
					Description: `Either a SSH KRL or a list of revoked public keys (without the principal prefix). See ssh-keygen(1) for details. If a public key is found in this file then it will always be treated as having trust level "never" and signatures will show as invalid`,
				}, {
					Name:        []string{`grep.column`},
					Description: `If set to true, enable the "--column" option by default`,
				}, {
					Name:        []string{`grep.extendedRegexp`},
					Description: `If set to true, enable "--extended-regexp" option by default. This option is ignored when the "grep.patternType" option is set to a value other than 'default'`,
				}, {
					Name:        []string{`grep.fallbackToNoIndex`},
					Description: `If set to true, fall back to git grep --no-index if git grep is executed outside of a git repository. Defaults to false`,
				}, {
					Name:        []string{`grep.lineNumber`},
					Description: `If set to true, enable "-n" option by default`,
				}, {
					Name:        []string{`grep.patternType`},
					Description: `Set the default matching behavior. Using a value of 'basic', 'extended', 'fixed', or 'perl' will enable the "--basic-regexp", "--extended-regexp", "--fixed-strings", or "--perl-regexp" option accordingly, while the value 'default' will use the "grep.extendedRegexp" option to choose between 'basic' and 'extended'`,
				}, {
					Name:        []string{`grep.threads`},
					Description: `Number of grep worker threads to use. See "grep.threads" in git-grep[1] for more information`,
				}, {
					Name:        []string{`gui.blamehistoryctx`},
					Description: `Specifies the radius of history context in days to show in gitk[1] for the selected commit, when the "Show History Context" menu item is invoked from 'git gui blame'. If this variable is set to zero, the whole history is shown`,
				}, {
					Name:        []string{`gui.commitMsgWidth`},
					Description: `Defines how wide the commit message window is in the git-gui[1]. "75" is the default`,
				}, {
					Name:        []string{`gui.copyBlameThreshold`},
					Description: `Specifies the threshold to use in 'git gui blame' original location detection, measured in alphanumeric characters. See the git-blame[1] manual for more information on copy detection`,
				}, {
					Name:        []string{`gui.diffContext`},
					Description: `Specifies how many context lines should be used in calls to diff made by the git-gui[1]. The default is "5"`,
				}, {
					Name:        []string{`gui.displayUntracked`},
					Description: `Determines if git-gui[1] shows untracked files in the file list. The default is "true"`,
				}, {
					Name:        []string{`gui.encoding`},
					Description: `Specifies the default character encoding to use for displaying of file contents in git-gui[1] and gitk[1]. It can be overridden by setting the 'encoding' attribute for relevant files (see gitattributes[5]). If this option is not set, the tools default to the locale encoding`,
				}, {
					Name:        []string{`gui.fastCopyBlame`},
					Description: `If true, 'git gui blame' uses "-C" instead of "-C -C" for original location detection. It makes blame significantly faster on huge repositories at the expense of less thorough copy detection`,
				}, {
					Name:        []string{`gui.matchTrackingBranch`},
					Description: `Determines if new branches created with git-gui[1] should default to tracking remote branches with matching names or not. Default: "false"`,
				}, {
					Name:        []string{`gui.newBranchTemplate`},
					Description: `Is used as suggested name when creating new branches using the git-gui[1]`,
				}, {
					Name:        []string{`gui.pruneDuringFetch`},
					Description: `"true" if git-gui[1] should prune remote-tracking branches when performing a fetch. The default value is "false"`,
				}, {
					Name:        []string{`gui.spellingDictionary`},
					Description: `Specifies the dictionary used for spell checking commit messages in the git-gui[1]. When set to "none" spell checking is turned off`,
				}, {
					Name:        []string{`gui.trustmtime`},
					Description: `Determines if git-gui[1] should trust the file modification timestamp or not. By default the timestamps are not trusted`,
				}, {
					Name:        []string{`guitool.<name>.argPrompt`},
					Description: `Request a string argument from the user, and pass it to the tool through the "ARGS" environment variable. Since requesting an argument implies confirmation, the 'confirm' option has no effect if this is enabled. If the option is set to 'true', 'yes', or '1', the dialog uses a built-in generic prompt; otherwise the exact value of the variable is used`,
				}, {
					Name:        []string{`guitool.<name>.cmd`},
					Description: `Specifies the shell command line to execute when the corresponding item of the git-gui[1] "Tools" menu is invoked. This option is mandatory for every tool. The command is executed from the root of the working directory, and in the environment it receives the name of the tool as "GIT_GUITOOL", the name of the currently selected file as 'FILENAME', and the name of the current branch as 'CUR_BRANCH' (if the head is detached, 'CUR_BRANCH' is empty)`,
				}, {
					Name:        []string{`guitool.<name>.confirm`},
					Description: `Show a confirmation dialog before actually running the tool`,
				}, {
					Name:        []string{`guitool.<name>.needsFile`},
					Description: `Run the tool only if a diff is selected in the GUI. It guarantees that 'FILENAME' is not empty`,
				}, {
					Name:        []string{`guitool.<name>.noConsole`},
					Description: `Run the command silently, without creating a window to display its output`,
				}, {
					Name:        []string{`guitool.<name>.noRescan`},
					Description: `Don't rescan the working directory for changes after the tool finishes execution`,
				}, {
					Name:        []string{`guitool.<name>.prompt`},
					Description: `Specifies the general prompt string to display at the top of the dialog, before subsections for 'argPrompt' and 'revPrompt'. The default value includes the actual command`,
				}, {
					Name:        []string{`guitool.<name>.revPrompt`},
					Description: `Request a single valid revision from the user, and set the "REVISION" environment variable. In other aspects this option is similar to 'argPrompt', and can be used together with it`,
				}, {
					Name:        []string{`guitool.<name>.revUnmerged`},
					Description: `Show only unmerged branches in the 'revPrompt' subdialog. This is useful for tools similar to merge or rebase, but not for things like checkout or reset`,
				}, {
					Name:        []string{`guitool.<name>.title`},
					Description: `Specifies the title to use for the prompt dialog. The default is the tool name`,
				}, {
					Name:        []string{`help.autoCorrect`},
					Description: `If git detects typos and can identify exactly one valid command similar to the error, git will try to suggest the correct command or even run the suggestion automatically. Possible config values are: - 0 (default): show the suggested command. - positive number: run the suggested command after specified`,
				}, {
					Name:        []string{`help.browser`},
					Description: `Specify the browser that will be used to display help in the 'web' format. See git-help[1]`,
				}, {
					Name:        []string{`help.format`},
					Description: `Override the default help format used by git-help[1]. Values 'man', 'info', 'web' and 'html' are supported. 'man' is the default. 'web' and 'html' are the same`,
				}, {
					Name:        []string{`help.htmlPath`},
					Description: `Specify the path where the HTML documentation resides. File system paths and URLs are supported. HTML pages will be prefixed with this path when help is displayed in the 'web' format. This defaults to the documentation path of your Git installation`,
				}, {
					Name:        []string{`http.cookieFile`},
					Description: `The pathname of a file containing previously stored cookie lines, which should be used in the Git http session, if they match the server. The file format of the file to read cookies from should be plain HTTP headers or the Netscape/Mozilla cookie file format (see "curl(1)"). NOTE that the file specified with http.cookieFile is used only as input unless http.saveCookies is set`,
				}, {
					Name:        []string{`http.curloptResolve`},
					Description: `Hostname resolution information that will be used first by libcurl when sending HTTP requests. This information should be in one of the following formats:`,
				}, {
					Name:        []string{`http.delegation`},
					Description: `Control GSSAPI credential delegation. The delegation is disabled by default in libcurl since version 7.21.7. Set parameter to tell the server what it is allowed to delegate when it comes to user credentials. Used with GSS/kerberos. Possible values are:`,
				}, {
					Name:        []string{`http.emptyAuth`},
					Description: `Attempt authentication without seeking a username or password. This can be used to attempt GSS-Negotiate authentication without specifying a username in the URL, as libcurl normally requires a username for authentication`,
				}, {
					Name:        []string{`http.extraHeader`},
					Description: `Pass an additional HTTP header when communicating with a server. If more than one such entry exists, all of them are added as extra headers. To allow overriding the settings inherited from the system config, an empty value will reset the extra headers to the empty list`,
				}, {
					Name:        []string{`http.followRedirects`},
					Description: `Whether git should follow HTTP redirects. If set to "true", git will transparently follow any redirect issued by a server it encounters. If set to "false", git will treat all redirects as errors. If set to "initial", git will follow redirects only for the initial request to a remote, but not for subsequent follow-up HTTP requests. Since git uses the redirected URL as the base for the follow-up requests, this is generally sufficient. The default is "initial"`,
				}, {
					Name:        []string{`http.lowSpeedLimit`},
					Description: `If the HTTP transfer speed is less than 'http.lowSpeedLimit' for longer than 'http.lowSpeedTime' seconds, the transfer is aborted. Can be overridden by the "GIT_HTTP_LOW_SPEED_LIMIT" and "GIT_HTTP_LOW_SPEED_TIME" environment variables`,
				}, {
					Name:        []string{`http.maxRequests`},
					Description: `How many HTTP requests to launch in parallel. Can be overridden by the "GIT_HTTP_MAX_REQUESTS" environment variable. Default is 5`,
				}, {
					Name:        []string{`http.minSessions`},
					Description: `The number of curl sessions (counted across slots) to be kept across requests. They will not be ended with curl_easy_cleanup() until http_cleanup() is invoked. If USE_CURL_MULTI is not defined, this value will be capped at 1. Defaults to 1`,
				}, {
					Name:        []string{`http.noEPSV`},
					Description: `A boolean which disables using of EPSV ftp command by curl. This can helpful with some "poor" ftp servers which don't support EPSV mode. Can be overridden by the "GIT_CURL_FTP_NO_EPSV" environment variable. Default is false (curl will use EPSV)`,
				}, {
					Name:        []string{`http.pinnedPubkey`},
					Description: `Public key of the https service. It may either be the filename of a PEM or DER encoded public key file or a string starting with 'sha256//' followed by the base64 encoded sha256 hash of the public key. See also libcurl 'CURLOPT_PINNEDPUBLICKEY'. git will exit with an error if this option is set but not supported by cURL`,
				}, {
					Name:        []string{`http.postBuffer`},
					Description: `Maximum size in bytes of the buffer used by smart HTTP transports when POSTing data to the remote system. For requests larger than this buffer size, HTTP/1.1 and Transfer-Encoding: chunked is used to avoid creating a massive pack file locally. Default is 1 MiB, which is sufficient for most requests`,
				}, {
					Name:        []string{`http.proxy`},
					Description: `Override the HTTP proxy, normally configured using the 'http_proxy', 'https_proxy', and 'all_proxy' environment variables (see "curl(1)"). In addition to the syntax understood by curl, it is possible to specify a proxy string with a user name but no password, in which case git will attempt to acquire one in the same way it does for other credentials. See gitcredentials[7] for more information. The syntax thus is '[protocol://][user[:password]@]proxyhost[:port]'. This can be overridden on a per-remote basis; see remote.<name>.proxy`,
				}, {
					Name:        []string{`http.proxyAuthMethod`},
					Description: `Set the method with which to authenticate against the HTTP proxy. This only takes effect if the configured proxy string contains a user name part (i.e. is of the form 'user@host' or 'user@host:port'). This can be overridden on a per-remote basis; see "remote.<name>.proxyAuthMethod". Both can be overridden by the "GIT_HTTP_PROXY_AUTHMETHOD" environment variable. Possible values are:`,
				}, {
					Name:        []string{`http.proxySSLCAInfo`},
					Description: `Pathname to the file containing the certificate bundle that should be used to verify the proxy with when using an HTTPS proxy. Can be overridden by the "GIT_PROXY_SSL_CAINFO" environment variable`,
				}, {
					Name:        []string{`http.proxySSLCert`},
					Description: `The pathname of a file that stores a client certificate to use to authenticate with an HTTPS proxy. Can be overridden by the "GIT_PROXY_SSL_CERT" environment variable`,
				}, {
					Name:        []string{`http.proxySSLCertPasswordProtected`},
					Description: `Enable Git's password prompt for the proxy SSL certificate. Otherwise OpenSSL will prompt the user, possibly many times, if the certificate or private key is encrypted. Can be overridden by the "GIT_PROXY_SSL_CERT_PASSWORD_PROTECTED" environment variable`,
				}, {
					Name:        []string{`http.proxySSLKey`},
					Description: `The pathname of a file that stores a private key to use to authenticate with an HTTPS proxy. Can be overridden by the "GIT_PROXY_SSL_KEY" environment variable`,
				}, {
					Name:        []string{`http.saveCookies`},
					Description: `If set, store cookies received during requests to the file specified by http.cookieFile. Has no effect if http.cookieFile is unset`,
				}, {
					Name:        []string{`http.schannelCheckRevoke`},
					Description: `Used to enforce or disable certificate revocation checks in cURL when http.sslBackend is set to "schannel". Defaults to "true" if unset. Only necessary to disable this if Git consistently errors and the message is about checking the revocation status of a certificate. This option is ignored if cURL lacks support for setting the relevant SSL option at runtime`,
				}, {
					Name:        []string{`http.schannelUseSSLCAInfo`},
					Description: `As of cURL v7.60.0, the Secure Channel backend can use the certificate bundle provided via "http.sslCAInfo", but that would override the Windows Certificate Store. Since this is not desirable by default, Git will tell cURL not to use that bundle by default when the "schannel" backend was configured via "http.sslBackend", unless "http.schannelUseSSLCAInfo" overrides this behavior`,
				}, {
					Name:        []string{`http.sslBackend`},
					Description: `Name of the SSL backend to use (e.g. "openssl" or "schannel"). This option is ignored if cURL lacks support for choosing the SSL backend at runtime`,
				}, {
					Name:        []string{`http.sslCAInfo`},
					Description: `File containing the certificates to verify the peer with when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_CAINFO" environment variable`,
				}, {
					Name:        []string{`http.sslCAPath`},
					Description: `Path containing files with the CA certificates to verify the peer with when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_CAPATH" environment variable`,
				}, {
					Name:        []string{`http.sslCert`},
					Description: `File containing the SSL certificate when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_CERT" environment variable`,
				}, {
					Name:        []string{`http.sslCertPasswordProtected`},
					Description: `Enable Git's password prompt for the SSL certificate. Otherwise OpenSSL will prompt the user, possibly many times, if the certificate or private key is encrypted. Can be overridden by the "GIT_SSL_CERT_PASSWORD_PROTECTED" environment variable`,
				}, {
					Name:        []string{`http.sslKey`},
					Description: `File containing the SSL private key when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_KEY" environment variable`,
				}, {
					Name:        []string{`http.sslTry`},
					Description: `Attempt to use AUTH SSL/TLS and encrypted data transfers when connecting via regular FTP protocol. This might be needed if the FTP server requires it for security reasons or you wish to connect securely whenever remote FTP server supports it. Default is false since it might trigger certificate verification errors on misconfigured servers`,
				}, {
					Name:        []string{`http.sslVerify`},
					Description: `Whether to verify the SSL certificate when fetching or pushing over HTTPS. Defaults to true. Can be overridden by the "GIT_SSL_NO_VERIFY" environment variable`,
				}, {
					Name:        []string{`http.sslVersion`},
					Description: `The SSL version to use when negotiating an SSL connection, if you want to force the default. The available and default version depend on whether libcurl was built against NSS or OpenSSL and the particular configuration of the crypto library in use. Internally this sets the 'CURLOPT_SSL_VERSION' option; see the libcurl documentation for more details on the format of this option and for the ssl version supported. Currently the possible values of this option are:`,
				}, {
					Name:        []string{`http.userAgent`},
					Description: `The HTTP USER_AGENT string presented to an HTTP server. The default value represents the version of the client Git such as git/1.7.1. This option allows you to override this value to a more common value such as Mozilla/4.0. This may be necessary, for instance, if connecting through a firewall that restricts HTTP connections to a set of common USER_AGENT strings (but not including those like git/1.7.1). Can be overridden by the "GIT_HTTP_USER_AGENT" environment variable`,
				}, {
					Name:        []string{`http.version`},
					Description: `Use the specified HTTP protocol version when communicating with a server. If you want to force the default. The available and default version depend on libcurl. Currently the possible values of this option are:`,
				}, {
					Name:        []string{`http.<url>.cookieFile`},
					Description: `The pathname of a file containing previously stored cookie lines, which should be used in the Git http session, if they match the server. The file format of the file to read cookies from should be plain HTTP headers or the Netscape/Mozilla cookie file format (see "curl(1)"). NOTE that the file specified with http.cookieFile is used only as input unless http.saveCookies is set`,
				}, {
					Name:        []string{`http.<url>.curloptResolve`},
					Description: `Hostname resolution information that will be used first by libcurl when sending HTTP requests. This information should be in one of the following formats:`,
				}, {
					Name:        []string{`http.<url>.delegation`},
					Description: `Control GSSAPI credential delegation. The delegation is disabled by default in libcurl since version 7.21.7. Set parameter to tell the server what it is allowed to delegate when it comes to user credentials. Used with GSS/kerberos. Possible values are:`,
				}, {
					Name:        []string{`http.<url>.emptyAuth`},
					Description: `Attempt authentication without seeking a username or password. This can be used to attempt GSS-Negotiate authentication without specifying a username in the URL, as libcurl normally requires a username for authentication`,
				}, {
					Name:        []string{`http.<url>.extraHeader`},
					Description: `Pass an additional HTTP header when communicating with a server. If more than one such entry exists, all of them are added as extra headers. To allow overriding the settings inherited from the system config, an empty value will reset the extra headers to the empty list`,
				}, {
					Name:        []string{`http.<url>.followRedirects`},
					Description: `Whether git should follow HTTP redirects. If set to "true", git will transparently follow any redirect issued by a server it encounters. If set to "false", git will treat all redirects as errors. If set to "initial", git will follow redirects only for the initial request to a remote, but not for subsequent follow-up HTTP requests. Since git uses the redirected URL as the base for the follow-up requests, this is generally sufficient. The default is "initial"`,
				}, {
					Name:        []string{`http.<url>.lowSpeedLimit`},
					Description: `If the HTTP transfer speed is less than 'http.lowSpeedLimit' for longer than 'http.lowSpeedTime' seconds, the transfer is aborted. Can be overridden by the "GIT_HTTP_LOW_SPEED_LIMIT" and "GIT_HTTP_LOW_SPEED_TIME" environment variables`,
				}, {
					Name:        []string{`http.<url>.maxRequests`},
					Description: `How many HTTP requests to launch in parallel. Can be overridden by the "GIT_HTTP_MAX_REQUESTS" environment variable. Default is 5`,
				}, {
					Name:        []string{`http.<url>.minSessions`},
					Description: `The number of curl sessions (counted across slots) to be kept across requests. They will not be ended with curl_easy_cleanup() until http_cleanup() is invoked. If USE_CURL_MULTI is not defined, this value will be capped at 1. Defaults to 1`,
				}, {
					Name:        []string{`http.<url>.noEPSV`},
					Description: `A boolean which disables using of EPSV ftp command by curl. This can helpful with some "poor" ftp servers which don't support EPSV mode. Can be overridden by the "GIT_CURL_FTP_NO_EPSV" environment variable. Default is false (curl will use EPSV)`,
				}, {
					Name:        []string{`http.<url>.pinnedPubkey`},
					Description: `Public key of the https service. It may either be the filename of a PEM or DER encoded public key file or a string starting with 'sha256//' followed by the base64 encoded sha256 hash of the public key. See also libcurl 'CURLOPT_PINNEDPUBLICKEY'. git will exit with an error if this option is set but not supported by cURL`,
				}, {
					Name:        []string{`http.<url>.postBuffer`},
					Description: `Maximum size in bytes of the buffer used by smart HTTP transports when POSTing data to the remote system. For requests larger than this buffer size, HTTP/1.1 and Transfer-Encoding: chunked is used to avoid creating a massive pack file locally. Default is 1 MiB, which is sufficient for most requests`,
				}, {
					Name:        []string{`http.<url>.proxy`},
					Description: `Override the HTTP proxy, normally configured using the 'http_proxy', 'https_proxy', and 'all_proxy' environment variables (see "curl(1)"). In addition to the syntax understood by curl, it is possible to specify a proxy string with a user name but no password, in which case git will attempt to acquire one in the same way it does for other credentials. See gitcredentials[7] for more information. The syntax thus is '[protocol://][user[:password]@]proxyhost[:port]'. This can be overridden on a per-remote basis; see remote.<name>.proxy`,
				}, {
					Name:        []string{`http.<url>.proxyAuthMethod`},
					Description: `Set the method with which to authenticate against the HTTP proxy. This only takes effect if the configured proxy string contains a user name part (i.e. is of the form 'user@host' or 'user@host:port'). This can be overridden on a per-remote basis; see "remote.<name>.proxyAuthMethod". Both can be overridden by the "GIT_HTTP_PROXY_AUTHMETHOD" environment variable. Possible values are:`,
				}, {
					Name:        []string{`http.<url>.proxySSLCAInfo`},
					Description: `Pathname to the file containing the certificate bundle that should be used to verify the proxy with when using an HTTPS proxy. Can be overridden by the "GIT_PROXY_SSL_CAINFO" environment variable`,
				}, {
					Name:        []string{`http.<url>.proxySSLCert`},
					Description: `The pathname of a file that stores a client certificate to use to authenticate with an HTTPS proxy. Can be overridden by the "GIT_PROXY_SSL_CERT" environment variable`,
				}, {
					Name:        []string{`http.<url>.proxySSLCertPasswordProtected`},
					Description: `Enable Git's password prompt for the proxy SSL certificate. Otherwise OpenSSL will prompt the user, possibly many times, if the certificate or private key is encrypted. Can be overridden by the "GIT_PROXY_SSL_CERT_PASSWORD_PROTECTED" environment variable`,
				}, {
					Name:        []string{`http.<url>.proxySSLKey`},
					Description: `The pathname of a file that stores a private key to use to authenticate with an HTTPS proxy. Can be overridden by the "GIT_PROXY_SSL_KEY" environment variable`,
				}, {
					Name:        []string{`http.<url>.saveCookies`},
					Description: `If set, store cookies received during requests to the file specified by http.cookieFile. Has no effect if http.cookieFile is unset`,
				}, {
					Name:        []string{`http.<url>.schannelCheckRevoke`},
					Description: `Used to enforce or disable certificate revocation checks in cURL when http.sslBackend is set to "schannel". Defaults to "true" if unset. Only necessary to disable this if Git consistently errors and the message is about checking the revocation status of a certificate. This option is ignored if cURL lacks support for setting the relevant SSL option at runtime`,
				}, {
					Name:        []string{`http.<url>.schannelUseSSLCAInfo`},
					Description: `As of cURL v7.60.0, the Secure Channel backend can use the certificate bundle provided via "http.sslCAInfo", but that would override the Windows Certificate Store. Since this is not desirable by default, Git will tell cURL not to use that bundle by default when the "schannel" backend was configured via "http.sslBackend", unless "http.schannelUseSSLCAInfo" overrides this behavior`,
				}, {
					Name:        []string{`http.<url>.sslBackend`},
					Description: `Name of the SSL backend to use (e.g. "openssl" or "schannel"). This option is ignored if cURL lacks support for choosing the SSL backend at runtime`,
				}, {
					Name:        []string{`http.<url>.sslCAInfo`},
					Description: `File containing the certificates to verify the peer with when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_CAINFO" environment variable`,
				}, {
					Name:        []string{`http.<url>.sslCAPath`},
					Description: `Path containing files with the CA certificates to verify the peer with when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_CAPATH" environment variable`,
				}, {
					Name:        []string{`http.<url>.sslCert`},
					Description: `File containing the SSL certificate when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_CERT" environment variable`,
				}, {
					Name:        []string{`http.<url>.sslCertPasswordProtected`},
					Description: `Enable Git's password prompt for the SSL certificate. Otherwise OpenSSL will prompt the user, possibly many times, if the certificate or private key is encrypted. Can be overridden by the "GIT_SSL_CERT_PASSWORD_PROTECTED" environment variable`,
				}, {
					Name:        []string{`http.<url>.sslKey`},
					Description: `File containing the SSL private key when fetching or pushing over HTTPS. Can be overridden by the "GIT_SSL_KEY" environment variable`,
				}, {
					Name:        []string{`http.<url>.sslTry`},
					Description: `Attempt to use AUTH SSL/TLS and encrypted data transfers when connecting via regular FTP protocol. This might be needed if the FTP server requires it for security reasons or you wish to connect securely whenever remote FTP server supports it. Default is false since it might trigger certificate verification errors on misconfigured servers`,
				}, {
					Name:        []string{`http.<url>.sslVerify`},
					Description: `Whether to verify the SSL certificate when fetching or pushing over HTTPS. Defaults to true. Can be overridden by the "GIT_SSL_NO_VERIFY" environment variable`,
				}, {
					Name:        []string{`http.<url>.sslVersion`},
					Description: `The SSL version to use when negotiating an SSL connection, if you want to force the default. The available and default version depend on whether libcurl was built against NSS or OpenSSL and the particular configuration of the crypto library in use. Internally this sets the 'CURLOPT_SSL_VERSION' option; see the libcurl documentation for more details on the format of this option and for the ssl version supported. Currently the possible values of this option are:`,
				}, {
					Name:        []string{`http.<url>.userAgent`},
					Description: `The HTTP USER_AGENT string presented to an HTTP server. The default value represents the version of the client Git such as git/1.7.1. This option allows you to override this value to a more common value such as Mozilla/4.0. This may be necessary, for instance, if connecting through a firewall that restricts HTTP connections to a set of common USER_AGENT strings (but not including those like git/1.7.1). Can be overridden by the "GIT_HTTP_USER_AGENT" environment variable`,
				}, {
					Name:        []string{`http.<url>.version`},
					Description: `Use the specified HTTP protocol version when communicating with a server. If you want to force the default. The available and default version depend on libcurl. Currently the possible values of this option are:`,
				}, {
					Name:        []string{`i18n.commitEncoding`},
					Description: `Character encoding the commit messages are stored in; Git itself does not care per se, but this information is necessary e.g. when importing commits from emails or in the gitk graphical history browser (and possibly at other places in the future or in other porcelains). See e.g. git-mailinfo[1]. Defaults to 'utf-8'`,
				}, {
					Name:        []string{`i18n.logOutputEncoding`},
					Description: `Character encoding the commit messages are converted to when running 'git log' and friends`,
				}, {
					Name:        []string{`imap.authMethod`},
					Description: `Specify authenticate method for authentication with IMAP server. If Git was built with the NO_CURL option, or if your curl version is older than 7.34.0, or if you're running git-imap-send with the "--no-curl" option, the only supported method is 'CRAM-MD5'. If this is not set then 'git imap-send' uses the basic IMAP plaintext LOGIN command`,
				}, {
					Name:        []string{`imap.folder`},
					Description: `The folder to drop the mails into, which is typically the Drafts folder. For example: "INBOX.Drafts", "INBOX/Drafts" or "[Gmail]/Drafts". Required`,
				}, {
					Name:        []string{`imap.host`},
					Description: `A URL identifying the server. Use an "imap://" prefix for non-secure connections and an "imaps://" prefix for secure connections. Ignored when imap.tunnel is set, but required otherwise`,
				}, {
					Name:        []string{`imap.pass`},
					Description: `The password to use when logging in to the server`,
				}, {
					Name:        []string{`imap.port`},
					Description: `An integer port number to connect to on the server. Defaults to 143 for imap:// hosts and 993 for imaps:// hosts. Ignored when imap.tunnel is set`,
				}, {
					Name:        []string{`imap.preformattedHTML`},
					Description: `A boolean to enable/disable the use of html encoding when sending a patch. An html encoded patch will be bracketed with <pre> and have a content type of text/html. Ironically, enabling this option causes Thunderbird to send the patch as a plain/text, format=fixed email. Default is "false"`,
				}, {
					Name:        []string{`imap.sslverify`},
					Description: `A boolean to enable/disable verification of the server certificate used by the SSL/TLS connection. Default is "true". Ignored when imap.tunnel is set`,
				}, {
					Name:        []string{`imap.tunnel`},
					Description: `Command used to setup a tunnel to the IMAP server through which commands will be piped instead of using a direct network connection to the server. Required when imap.host is not set`,
				}, {
					Name:        []string{`imap.user`},
					Description: `The username to use when logging in to the server`,
				}, {
					Name:        []string{`includeIf.<condition>.path`},
					Description: `Special variables to include other configuration files. See the "CONFIGURATION FILE" section in the main git-config[1] documentation, specifically the "Includes" and "Conditional Includes" subsections`,
				}, {
					Name:        []string{`index.recordEndOfIndexEntries`},
					Description: `Specifies whether the index file should include an "End Of Index Entry" section. This reduces index load time on multiprocessor machines but produces a message "ignoring EOIE extension" when reading the index using Git versions before 2.20. Defaults to 'true' if index.threads has been explicitly enabled, 'false' otherwise`,
				}, {
					Name:        []string{`index.recordOffsetTable`},
					Description: `Specifies whether the index file should include an "Index Entry Offset Table" section. This reduces index load time on multiprocessor machines but produces a message "ignoring IEOT extension" when reading the index using Git versions before 2.20. Defaults to 'true' if index.threads has been explicitly enabled, 'false' otherwise`,
				}, {
					Name:        []string{`index.sparse`},
					Description: `When enabled, write the index using sparse-directory entries. This has no effect unless "core.sparseCheckout" and "core.sparseCheckoutCone" are both enabled. Defaults to 'false'`,
				}, {
					Name:        []string{`index.threads`},
					Description: `Specifies the number of threads to spawn when loading the index. This is meant to reduce index load time on multiprocessor machines. Specifying 0 or 'true' will cause Git to auto-detect the number of CPU's and set the number of threads accordingly. Specifying 1 or 'false' will disable multithreading. Defaults to 'true'`,
				}, {
					Name:        []string{`index.version`},
					Description: `Specify the version with which new index files should be initialized. This does not affect existing repositories. If "feature.manyFiles" is enabled, then the default is 4`,
				}, {
					Name:        []string{`init.defaultBranch`},
					Description: `Allows overriding the default branch name e.g. when initializing a new repository`,
				}, {
					Name:        []string{`init.templateDir`},
					Description: `Specify the directory from which templates will be copied. (See the "TEMPLATE DIRECTORY" section of git-init[1].)`,
				}, {
					Name:        []string{`instaweb.browser`},
					Description: `Specify the program that will be used to browse your working repository in gitweb. See git-instaweb[1]`,
				}, {
					Name:        []string{`instaweb.httpd`},
					Description: `The HTTP daemon command-line to start gitweb on your working repository. See git-instaweb[1]`,
				}, {
					Name:        []string{`instaweb.local`},
					Description: `If true the web server started by git-instaweb[1] will be bound to the local IP (127.0.0.1)`,
				}, {
					Name:        []string{`instaweb.modulePath`},
					Description: `The default module path for git-instaweb[1] to use instead of /usr/lib/apache2/modules. Only used if httpd is Apache`,
				}, {
					Name:        []string{`instaweb.port`},
					Description: `The port number to bind the gitweb httpd to. See git-instaweb[1]`,
				}, {
					Name:        []string{`interactive.diffFilter`},
					Description: `When an interactive command (such as "git add --patch") shows a colorized diff, git will pipe the diff through the shell command defined by this configuration variable. The command may mark up the diff further for human consumption, provided that it retains a one-to-one correspondence with the lines in the original diff. Defaults to disabled (no filtering)`,
				}, {
					Name:        []string{`interactive.singleKey`},
					Description: `In interactive commands, allow the user to provide one-letter input with a single key (i.e., without hitting enter). Currently this is used by the "--patch" mode of git-add[1], git-checkout[1], git-restore[1], git-commit[1], git-reset[1], and git-stash[1]. Note that this setting is silently ignored if portable keystroke input is not available; requires the Perl module Term::ReadKey`,
				}, {
					Name:        []string{`log.abbrevCommit`},
					Description: `If true, makes git-log[1], git-show[1], and git-whatchanged[1] assume "--abbrev-commit". You may override this option with "--no-abbrev-commit"`,
				}, {
					Name:        []string{`log.date`},
					Description: `Set the default date-time mode for the 'log' command. Setting a value for log.date is similar to using 'git log''s "--date" option. See git-log[1] for details`,
				}, {
					Name:        []string{`log.decorate`},
					Description: `Print out the ref names of any commits that are shown by the log command. If 'short' is specified, the ref name prefixes 'refs/heads/', 'refs/tags/' and 'refs/remotes/' will not be printed. If 'full' is specified, the full ref name (including prefix) will be printed. If 'auto' is specified, then if the output is going to a terminal, the ref names are shown as if 'short' were given, otherwise no ref names are shown. This is the same as the "--decorate" option of the "git log"`,
				}, {
					Name:        []string{`log.diffMerges`},
					Description: `Set default diff format to be used for merge commits. See "--diff-merges" in git-log[1] for details. Defaults to "separate"`,
				}, {
					Name:        []string{`log.excludeDecoration`},
					Description: `Exclude the specified patterns from the log decorations. This is similar to the "--decorate-refs-exclude" command-line option, but the config option can be overridden by the "--decorate-refs" option`,
				}, {
					Name:        []string{`log.follow`},
					Description: `If "true", "git log" will act as if the "--follow" option was used when a single <path> is given. This has the same limitations as "--follow", i.e. it cannot be used to follow multiple files and does not work well on non-linear history`,
				}, {
					Name:        []string{`log.graphColors`},
					Description: `A list of colors, separated by commas, that can be used to draw history lines in "git log --graph"`,
				}, {
					Name:        []string{`log.initialDecorationSet`},
					Description: `By default, "git log" only shows decorations for certain known ref namespaces. If 'all' is specified, then show all refs as decorations`,
				}, {
					Name:        []string{`log.mailmap`},
					Description: `If true, makes git-log[1], git-show[1], and git-whatchanged[1] assume "--use-mailmap", otherwise assume "--no-use-mailmap". True by default`,
				}, {
					Name:        []string{`log.showRoot`},
					Description: `If true, the initial commit will be shown as a big creation event. This is equivalent to a diff against an empty tree. Tools like git-log[1] or git-whatchanged[1], which normally hide the root commit will now show it. True by default`,
				}, {
					Name:        []string{`log.showSignature`},
					Description: `If true, makes git-log[1], git-show[1], and git-whatchanged[1] assume "--show-signature"`,
				}, {
					Name:        []string{`lsrefs.unborn`},
					Description: `May be "advertise" (the default), "allow", or "ignore". If "advertise", the server will respond to the client sending "unborn" (as described in gitprotocol-v2[5]) and will advertise support for this feature during the protocol v2 capability advertisement. "allow" is the same as "advertise" except that the server will not advertise support for this feature; this is useful for load-balanced servers that cannot be updated atomically (for example), since the administrator could configure "allow", then after a delay, configure "advertise"`,
				}, {
					Name:        []string{`mailinfo.scissors`},
					Description: `If true, makes git-mailinfo[1] (and therefore git-am[1]) act by default as if the --scissors option was provided on the command-line. When active, this features removes everything from the message body before a scissors line (i.e. consisting mainly of ">8", "8<" and "-")`,
				}, {
					Name:        []string{`mailmap.blob`},
					Description: `Like "mailmap.file", but consider the value as a reference to a blob in the repository. If both "mailmap.file" and "mailmap.blob" are given, both are parsed, with entries from "mailmap.file" taking precedence. In a bare repository, this defaults to "HEAD:.mailmap". In a non-bare repository, it defaults to empty`,
				}, {
					Name:        []string{`mailmap.file`},
					Description: `The location of an augmenting mailmap file. The default mailmap, located in the root of the repository, is loaded first, then the mailmap file pointed to by this variable. The location of the mailmap file may be in a repository subdirectory, or somewhere outside of the repository itself. See git-shortlog[1] and git-blame[1]`,
				}, {
					Name:        []string{`maintenance.<task>.enabled`},
					Description: `This boolean config option controls whether the maintenance task with name "<task>" is run when no "--task" option is specified to "git maintenance run". These config values are ignored if a "--task" option exists. By default, only "maintenance.gc.enabled" is true`,
				}, {
					Name:        []string{`maintenance.<task>.schedule`},
					Description: `This config option controls whether or not the given "<task>" runs during a "git maintenance run --schedule=<frequency>" command. The value must be one of "hourly", "daily", or "weekly"`,
				}, {
					Name:        []string{`maintenance.auto`},
					Description: `This boolean config option controls whether some commands run "git maintenance run --auto" after doing their normal work. Defaults to true`,
				}, {
					Name:        []string{`maintenance.commit-graph.auto`},
					Description: `This integer config option controls how often the "commit-graph" task should be run as part of "git maintenance run --auto". If zero, then the "commit-graph" task will not run with the "--auto" option. A negative value will force the task to run every time. Otherwise, a positive value implies the command should run when the number of reachable commits that are not in the commit-graph file is at least the value of "maintenance.commit-graph.auto". The default value is 100`,
				}, {
					Name:        []string{`maintenance.incremental-repack.auto`},
					Description: `This integer config option controls how often the "incremental-repack" task should be run as part of "git maintenance run --auto". If zero, then the "incremental-repack" task will not run with the "--auto" option. A negative value will force the task to run every time. Otherwise, a positive value implies the command should run when the number of pack-files not in the multi-pack-index is at least the value of "maintenance.incremental-repack.auto". The default value is 10`,
				}, {
					Name:        []string{`maintenance.loose-objects.auto`},
					Description: `This integer config option controls how often the "loose-objects" task should be run as part of "git maintenance run --auto". If zero, then the "loose-objects" task will not run with the "--auto" option. A negative value will force the task to run every time. Otherwise, a positive value implies the command should run when the number of loose objects is at least the value of "maintenance.loose-objects.auto". The default value is 100`,
				}, {
					Name:        []string{`maintenance.strategy`},
					Description: `This string config option provides a way to specify one of a few recommended schedules for background maintenance. This only affects which tasks are run during "git maintenance run --schedule=X" commands, provided no "--task=<task>" arguments are provided. Further, if a "maintenance.<task>.schedule" config value is set, then that value is used instead of the one provided by "maintenance.strategy". The possible strategy strings are:`,
				}, {
					Name:        []string{`man.<tool>.cmd`},
					Description: `Specify the command to invoke the specified man viewer. The specified command is evaluated in shell with the man page passed as argument. (See git-help[1].)`,
				}, {
					Name:        []string{`man.<tool>.path`},
					Description: `Override the path for the given tool that may be used to display help in the 'man' format. See git-help[1]`,
				}, {
					Name:        []string{`man.viewer`},
					Description: `Specify the programs that may be used to display help in the 'man' format. See git-help[1]`,
				}, {
					Name:        []string{`merge.<driver>.driver`},
					Description: `Defines the command that implements a custom low-level merge driver. See gitattributes[5] for details`,
				}, {
					Name:        []string{`merge.<driver>.name`},
					Description: `Defines a human-readable name for a custom low-level merge driver. See gitattributes[5] for details`,
				}, {
					Name:        []string{`merge.<driver>.recursive`},
					Description: `Names a low-level merge driver to be used when performing an internal merge between common ancestors. See gitattributes[5] for details`,
				}, {
					Name:        []string{`merge.autoStash`},
					Description: `When set to true, automatically create a temporary stash entry before the operation begins, and apply it after the operation ends. This means that you can run merge on a dirty worktree. However, use with care: the final stash application after a successful merge might result in non-trivial conflicts. This option can be overridden by the "--no-autostash" and "--autostash" options of git-merge[1]. Defaults to false`,
				}, {
					Name:        []string{`merge.branchdesc`},
					Description: `In addition to branch names, populate the log message with the branch description text associated with them. Defaults to false`,
				}, {
					Name:        []string{`merge.conflictStyle`},
					Description: `Specify the style in which conflicted hunks are written out to working tree files upon merge. The default is "merge", which shows a "<<<<<<<" conflict marker, changes made by one side, a "=======" marker, changes made by the other side, and then a ">>>>>>>" marker. An alternate style, "diff3", adds a "|||||||" marker and the original text before the "=======" marker. The "merge" style tends to produce smaller conflict regions than diff3, both because of the exclusion of the original text, and because when a subset of lines match on the two sides they are just pulled out of the conflict region. Another alternate style, "zdiff3", is similar to diff3 but removes matching lines on the two sides from the conflict region when those matching lines appear near either the beginning or end of a conflict region`,
				}, {
					Name:        []string{`merge.defaultToUpstream`},
					Description: `If merge is called without any commit argument, merge the upstream branches configured for the current branch by using their last observed values stored in their remote-tracking branches. The values of the "branch.<current branch>.merge" that name the branches at the remote named by "branch.<current branch>.remote" are consulted, and then they are mapped via "remote.<remote>.fetch" to their corresponding remote-tracking branches, and the tips of these tracking branches are merged. Defaults to true`,
				}, {
					Name:        []string{`merge.directoryRenames`},
					Description: `Whether Git detects directory renames, affecting what happens at merge time to new files added to a directory on one side of history when that directory was renamed on the other side of history. If merge.directoryRenames is set to "false", directory rename detection is disabled, meaning that such new files will be left behind in the old directory. If set to "true", directory rename detection is enabled, meaning that such new files will be moved into the new directory. If set to "conflict", a conflict will be reported for such paths. If merge.renames is false, merge.directoryRenames is ignored and treated as false. Defaults to "conflict"`,
				}, {
					Name:        []string{`merge.ff`},
					Description: `By default, Git does not create an extra merge commit when merging a commit that is a descendant of the current commit. Instead, the tip of the current branch is fast-forwarded. When set to "false", this variable tells Git to create an extra merge commit in such a case (equivalent to giving the "--no-ff" option from the command line). When set to "only", only such fast-forward merges are allowed (equivalent to giving the "--ff-only" option from the command line)`,
				}, {
					Name:        []string{`merge.guitool`},
					Description: `Controls which merge tool is used by git-mergetool[1] when the -g/--gui flag is specified. The list below shows the valid built-in values. Any other value is treated as a custom merge tool and requires that a corresponding mergetool.<guitool>.cmd variable is defined`,
				}, {
					Name:        []string{`merge.log`},
					Description: `In addition to branch names, populate the log message with at most the specified number of one-line descriptions from the actual commits that are being merged. Defaults to false, and true is a synonym for 20`,
				}, {
					Name:        []string{`merge.renameLimit`},
					Description: `The number of files to consider in the exhaustive portion of rename detection during a merge. If not specified, defaults to the value of diff.renameLimit. If neither merge.renameLimit nor diff.renameLimit are specified, currently defaults to 7000. This setting has no effect if rename detection is turned off`,
				}, {
					Name:        []string{`merge.renames`},
					Description: `Whether Git detects renames. If set to "false", rename detection is disabled. If set to "true", basic rename detection is enabled. Defaults to the value of diff.renames`,
				}, {
					Name:        []string{`merge.renormalize`},
					Description: `Tell Git that canonical representation of files in the repository has changed over time (e.g. earlier commits record text files with CRLF line endings, but recent ones use LF line endings). In such a repository, Git can convert the data recorded in commits to a canonical form before performing a merge to reduce unnecessary conflicts. For more information, see section "Merging branches with differing checkin/checkout attributes" in gitattributes[5]`,
				}, {
					Name:        []string{`merge.stat`},
					Description: `Whether to print the diffstat between ORIG_HEAD and the merge result at the end of the merge. True by default`,
				}, {
					Name:        []string{`merge.suppressDest`},
					Description: `By adding a glob that matches the names of integration branches to this multi-valued configuration variable, the default merge message computed for merges into these integration branches will omit "into <branch name>" from its title`,
				}, {
					Name:        []string{`merge.tool`},
					Description: `Controls which merge tool is used by git-mergetool[1]. The list below shows the valid built-in values. Any other value is treated as a custom merge tool and requires that a corresponding mergetool.<tool>.cmd variable is defined`,
				}, {
					Name:        []string{`merge.verbosity`},
					Description: `Controls the amount of output shown by the recursive merge strategy. Level 0 outputs nothing except a final error message if conflicts were detected. Level 1 outputs only conflicts, 2 outputs conflicts and file changes. Level 5 and above outputs debugging information. The default is level 2. Can be overridden by the "GIT_MERGE_VERBOSITY" environment variable`,
				}, {
					Name:        []string{`merge.verifySignatures`},
					Description: `If true, this is equivalent to the --verify-signatures command line option. See git-merge[1] for details`,
				}, {
					Name:        []string{`mergetool.<tool>.cmd`},
					Description: `Specify the command to invoke the specified merge tool. The specified command is evaluated in shell with the following variables available: 'BASE' is the name of a temporary file containing the common base of the files to be merged, if available; 'LOCAL' is the name of a temporary file containing the contents of the file on the current branch; 'REMOTE' is the name of a temporary file containing the contents of the file from the branch being merged; 'MERGED' contains the name of the file to which the merge tool should write the results of a successful merge`,
				}, {
					Name:        []string{`mergetool.<tool>.hideResolved`},
					Description: `Allows the user to override the global "mergetool.hideResolved" value for a specific tool. See "mergetool.hideResolved" for the full description`,
				}, {
					Name:        []string{`mergetool.<tool>.path`},
					Description: `Override the path for the given tool. This is useful in case your tool is not in the PATH`,
				}, {
					Name:        []string{`mergetool.<tool>.trustExitCode`},
					Description: `For a custom merge command, specify whether the exit code of the merge command can be used to determine whether the merge was successful. If this is not set to true then the merge target file timestamp is checked and the merge assumed to have been successful if the file has been updated, otherwise the user is prompted to indicate the success of the merge`,
				}, {
					Name:        []string{`mergetool.hideResolved`},
					Description: `During a merge Git will automatically resolve as many conflicts as possible and write the 'MERGED' file containing conflict markers around any conflicts that it cannot resolve; 'LOCAL' and 'REMOTE' normally represent the versions of the file from before Git's conflict resolution. This flag causes 'LOCAL' and 'REMOTE' to be overwriten so that only the unresolved conflicts are presented to the merge tool. Can be configured per-tool via the "mergetool.<tool>.hideResolved" configuration variable. Defaults to "false"`,
				}, {
					Name:        []string{`mergetool.keepBackup`},
					Description: `After performing a merge, the original file with conflict markers can be saved as a file with a ".orig" extension. If this variable is set to "false" then this file is not preserved. Defaults to "true" (i.e. keep the backup files)`,
				}, {
					Name:        []string{`mergetool.keepTemporaries`},
					Description: `When invoking a custom merge tool, Git uses a set of temporary files to pass to the tool. If the tool returns an error and this variable is set to "true", then these temporary files will be preserved, otherwise they will be removed after the tool has exited. Defaults to "false"`,
				}, {
					Name:        []string{`mergetool.meld.hasOutput`},
					Description: `Older versions of "meld" do not support the "--output" option. Git will attempt to detect whether "meld" supports "--output" by inspecting the output of "meld --help". Configuring "mergetool.meld.hasOutput" will make Git skip these checks and use the configured value instead. Setting "mergetool.meld.hasOutput" to "true" tells Git to unconditionally use the "--output" option, and "false" avoids using "--output"`,
				}, {
					Name:        []string{`mergetool.meld.useAutoMerge`},
					Description: `When the "--auto-merge" is given, meld will merge all non-conflicting parts automatically, highlight the conflicting parts and wait for user decision. Setting "mergetool.meld.useAutoMerge" to "true" tells Git to unconditionally use the "--auto-merge" option with "meld". Setting this value to "auto" makes git detect whether "--auto-merge" is supported and will only use "--auto-merge" when available. A value of "false" avoids using "--auto-merge" altogether, and is the default value`,
				}, {
					Name:        []string{`mergetool.prompt`},
					Description: `Prompt before each invocation of the merge resolution program`,
				}, {
					Name:        []string{`mergetool.vimdiff.layout`},
					Description: `The vimdiff backend uses this variable to control how its split windows look like. Applies even if you are using Neovim ("nvim") or gVim ("gvim") as the merge tool. See BACKEND SPECIFIC HINTS section`,
				}, {
					Name:        []string{`mergetool.writeToTemp`},
					Description: `Git writes temporary 'BASE', 'LOCAL', and 'REMOTE' versions of conflicting files in the worktree by default. Git will attempt to use a temporary directory for these files when set "true". Defaults to "false"`,
				}, {
					Name:        []string{`notes.<name>.mergeStrategy`},
					Description: `Which merge strategy to choose when doing a notes merge into refs/notes/<name>. This overrides the more general "notes.mergeStrategy". See the "NOTES MERGE STRATEGIES" section in git-notes[1] for more information on the available strategies`,
				}, {
					Name:        []string{`notes.displayRef`},
					Description: `The (fully qualified) refname from which to show notes when showing commit messages. The value of this variable can be set to a glob, in which case notes from all matching refs will be shown. You may also specify this configuration variable several times. A warning will be issued for refs that do not exist, but a glob that does not match any refs is silently ignored`,
				}, {
					Name:        []string{`notes.mergeStrategy`},
					Description: `Which merge strategy to choose by default when resolving notes conflicts. Must be one of "manual", "ours", "theirs", "union", or "cat_sort_uniq". Defaults to "manual". See "NOTES MERGE STRATEGIES" section of git-notes[1] for more information on each strategy`,
				}, {
					Name:        []string{`notes.rewrite.<command>`},
					Description: `When rewriting commits with <command> (currently "amend" or "rebase") and this variable is set to "true", Git automatically copies your notes from the original to the rewritten commit. Defaults to "true", but see "notes.rewriteRef" below`,
				}, {
					Name:        []string{`notes.rewriteMode`},
					Description: `When copying notes during a rewrite (see the "notes.rewrite.<command>" option), determines what to do if the target commit already has a note. Must be one of "overwrite", "concatenate", "cat_sort_uniq", or "ignore". Defaults to "concatenate"`,
				}, {
					Name:        []string{`notes.rewriteRef`},
					Description: `When copying notes during a rewrite, specifies the (fully qualified) ref whose notes should be copied. The ref may be a glob, in which case notes in all matching refs will be copied. You may also specify this configuration several times`,
				}, {
					Name:        []string{`pack.allowPackReuse`},
					Description: `When true, and when reachability bitmaps are enabled, pack-objects will try to send parts of the bitmapped packfile verbatim. This can reduce memory and CPU usage to serve fetches, but might result in sending a slightly larger pack. Defaults to true`,
				}, {
					Name:        []string{`pack.compression`},
					Description: `An integer -1..9, indicating the compression level for objects in a pack file. -1 is the zlib default. 0 means no compression, and 1..9 are various speed/size tradeoffs, 9 being slowest. If not set, defaults to core.compression. If that is not set, defaults to -1, the zlib default, which is "a default compromise between speed and compression (currently equivalent to level 6)."`,
				}, {
					Name:        []string{`pack.deltaCacheLimit`},
					Description: `The maximum size of a delta, that is cached in git-pack-objects[1]. This cache is used to speed up the writing object phase by not having to recompute the final delta result once the best match for all objects is found. Defaults to 1000. Maximum value is 65535`,
				}, {
					Name:        []string{`pack.deltaCacheSize`},
					Description: `The maximum memory in bytes used for caching deltas in git-pack-objects[1] before writing them out to a pack. This cache is used to speed up the writing object phase by not having to recompute the final delta result once the best match for all objects is found. Repacking large repositories on machines which are tight with memory might be badly impacted by this though, especially if this cache pushes the system into swapping. A value of 0 means no limit. The smallest size of 1 byte may be used to virtually disable this cache. Defaults to 256 MiB`,
				}, {
					Name:        []string{`pack.depth`},
					Description: `The maximum delta depth used by git-pack-objects[1] when no maximum depth is given on the command line. Defaults to 50. Maximum value is 4095`,
				}, {
					Name:        []string{`pack.indexVersion`},
					Description: `Specify the default pack index version. Valid values are 1 for legacy pack index used by Git versions prior to 1.5.2, and 2 for the new pack index with capabilities for packs larger than 4 GB as well as proper protection against the repacking of corrupted packs. Version 2 is the default. Note that version 2 is enforced and this config option ignored whenever the corresponding pack is larger than 2 GB`,
				}, {
					Name:        []string{`pack.island`},
					Description: `An extended regular expression configuring a set of delta islands. See "DELTA ISLANDS" in git-pack-objects[1] for details`,
				}, {
					Name:        []string{`pack.islandCore`},
					Description: `Specify an island name which gets to have its objects be packed first. This creates a kind of pseudo-pack at the front of one pack, so that the objects from the specified island are hopefully faster to copy into any pack that should be served to a user requesting these objects. In practice this means that the island specified should likely correspond to what is the most commonly cloned in the repo. See also "DELTA ISLANDS" in git-pack-objects[1]`,
				}, {
					Name:        []string{`pack.packSizeLimit`},
					Description: `The maximum size of a pack. This setting only affects packing to a file when repacking, i.e. the git:// protocol is unaffected. It can be overridden by the "--max-pack-size" option of git-repack[1]. Reaching this limit results in the creation of multiple packfiles`,
				}, {
					Name:        []string{`pack.preferBitmapTips`},
					Description: `When selecting which commits will receive bitmaps, prefer a commit at the tip of any reference that is a suffix of any value of this configuration over any other commits in the "selection window"`,
				}, {
					Name:        []string{`pack.threads`},
					Description: `Specifies the number of threads to spawn when searching for best delta matches. This requires that git-pack-objects[1] be compiled with pthreads otherwise this option is ignored with a warning. This is meant to reduce packing time on multiprocessor machines. The required amount of memory for the delta search window is however multiplied by the number of threads. Specifying 0 will cause Git to auto-detect the number of CPU's and set the number of threads accordingly`,
				}, {
					Name:        []string{`pack.useBitmaps`},
					Description: `When true, git will use pack bitmaps (if available) when packing to stdout (e.g., during the server side of a fetch). Defaults to true. You should not generally need to turn this off unless you are debugging pack bitmaps`,
				}, {
					Name:        []string{`pack.useSparse`},
					Description: `When true, git will default to using the '--sparse' option in 'git pack-objects' when the '--revs' option is present. This algorithm only walks trees that appear in paths that introduce new objects. This can have significant performance benefits when computing a pack to send a small change. However, it is possible that extra objects are added to the pack-file if the included commits contain certain types of direct renames. Default is "true"`,
				}, {
					Name:        []string{`pack.window`},
					Description: `The size of the window used by git-pack-objects[1] when no window size is given on the command line. Defaults to 10`,
				}, {
					Name:        []string{`pack.windowMemory`},
					Description: `The maximum size of memory that is consumed by each thread in git-pack-objects[1] for pack window memory when no limit is given on the command line. The value can be suffixed with "k", "m", or "g". When left unconfigured (or set explicitly to 0), there will be no limit`,
				}, {
					Name:        []string{`pack.writeBitmapHashCache`},
					Description: `When true, git will include a "hash cache" section in the bitmap index (if one is written). This cache can be used to feed git's delta heuristics, potentially leading to better deltas between bitmapped and non-bitmapped objects (e.g., when serving a fetch between an older, bitmapped pack and objects that have been pushed since the last gc). The downside is that it consumes 4 bytes per object of disk space. Defaults to true`,
				}, {
					Name:        []string{`pack.writeBitmapLookupTable`},
					Description: `When true, Git will include a "lookup table" section in the bitmap index (if one is written). This table is used to defer loading individual bitmaps as late as possible. This can be beneficial in repositories that have relatively large bitmap indexes. Defaults to false`,
				}, {
					Name:        []string{`pack.writeBitmaps`},
					Description: `This is a deprecated synonym for "repack.writeBitmaps"`,
				}, {
					Name:        []string{`pack.writeReverseIndex`},
					Description: `When true, git will write a corresponding .rev file (see: gitformat-pack[5]) for each new packfile that it writes in all places except for git-fast-import[1] and in the bulk checkin mechanism. Defaults to false`,
				}, {
					Name:        []string{`pager.<cmd>`},
					Description: `If the value is boolean, turns on or off pagination of the output of a particular Git subcommand when writing to a tty. Otherwise, turns on pagination for the subcommand using the pager specified by the value of "pager.<cmd>". If "--paginate" or "--no-pager" is specified on the command line, it takes precedence over this option. To disable pagination for all commands, set "core.pager" or "GIT_PAGER" to "cat"`,
				}, {
					Name:        []string{`pretty.<name>`},
					Description: `Alias for a --pretty= format string, as specified in git-log[1]. Any aliases defined here can be used just as the built-in pretty formats could. For example, running "git config pretty.changelog "format:* %H %s"" would cause the invocation "git log --pretty=changelog" to be equivalent to running "git log "--pretty=format:* %H %s"". Note that an alias with the same name as a built-in format will be silently ignored`,
				}, {
					Name:        []string{`protocol.<name>.allow`},
					Description: `Set a policy to be used by protocol "<name>" with clone/fetch/push commands. See "protocol.allow" above for the available policies`,
				}, {
					Name:        []string{`protocol.allow`},
					Description: `If set, provide a user defined default policy for all protocols which don't explicitly have a policy ("protocol.<name>.allow"). By default, if unset, known-safe protocols (http, https, git, ssh, file) have a default policy of "always", known-dangerous protocols (ext) have a default policy of "never", and all other protocols have a default policy of "user". Supported policies:`,
				}, {
					Name:        []string{`protocol.version`},
					Description: `If set, clients will attempt to communicate with a server using the specified protocol version. If the server does not support it, communication falls back to version 0. If unset, the default is "2". Supported versions:`,
				}, {
					Name:        []string{`pull.ff`},
					Description: `By default, Git does not create an extra merge commit when merging a commit that is a descendant of the current commit. Instead, the tip of the current branch is fast-forwarded. When set to "false", this variable tells Git to create an extra merge commit in such a case (equivalent to giving the "--no-ff" option from the command line). When set to "only", only such fast-forward merges are allowed (equivalent to giving the "--ff-only" option from the command line). This setting overrides "merge.ff" when pulling`,
				}, {
					Name:        []string{`pull.octopus`},
					Description: `The default merge strategy to use when pulling multiple branches at once`,
				}, {
					Name:        []string{`pull.rebase`},
					Description: `When true, rebase branches on top of the fetched branch, instead of merging the default branch from the default remote when "git pull" is run. See "branch.<name>.rebase" for setting this on a per-branch basis`,
				}, {
					Name:        []string{`pull.twohead`},
					Description: `The default merge strategy to use when pulling a single branch`,
				}, {
					Name:        []string{`push.autoSetupRemote`},
					Description: `If set to "true" assume "--set-upstream" on default push when no upstream tracking exists for the current branch; this option takes effect with push.default options 'simple', 'upstream', and 'current'. It is useful if by default you want new branches to be pushed to the default remote (like the behavior of 'push.default=current') and you also want the upstream tracking to be set. Workflows most likely to benefit from this option are 'simple' central workflows where all branches are expected to have the same name on the remote`,
				}, {
					Name:        []string{`push.default`},
					Description: `Defines the action "git push" should take if no refspec is given (whether from the command-line, config, or elsewhere). Different values are well-suited for specific workflows; for instance, in a purely central workflow (i.e. the fetch source is equal to the push destination), "upstream" is probably what you want. Possible values are:`,
				}, {
					Name:        []string{`push.followTags`},
					Description: `If set to true enable "--follow-tags" option by default. You may override this configuration at time of push by specifying "--no-follow-tags"`,
				}, {
					Name:        []string{`push.gpgSign`},
					Description: `May be set to a boolean value, or the string 'if-asked'. A true value causes all pushes to be GPG signed, as if "--signed" is passed to git-push[1]. The string 'if-asked' causes pushes to be signed if the server supports it, as if "--signed=if-asked" is passed to 'git push'. A false value may override a value from a lower-priority config file. An explicit command-line flag always overrides this config option`,
				}, {
					Name:        []string{`push.negotiate`},
					Description: `If set to "true", attempt to reduce the size of the packfile sent by rounds of negotiation in which the client and the server attempt to find commits in common. If "false", Git will rely solely on the server's ref advertisement to find commits in common`,
				}, {
					Name:        []string{`push.pushOption`},
					Description: `When no "--push-option=<option>" argument is given from the command line, "git push" behaves as if each <value> of this variable is given as "--push-option=<value>"`,
				}, {
					Name:        []string{`push.recurseSubmodules`},
					Description: `Make sure all submodule commits used by the revisions to be pushed are available on a remote-tracking branch. If the value is 'check' then Git will verify that all submodule commits that changed in the revisions to be pushed are available on at least one remote of the submodule. If any commits are missing, the push will be aborted and exit with non-zero status. If the value is 'on-demand' then all submodules that changed in the revisions to be pushed will be pushed. If on-demand was not able to push all necessary revisions it will also be aborted and exit with non-zero status. If the value is 'no' then default behavior of ignoring submodules when pushing is retained. You may override this configuration at time of push by specifying '--recurse-submodules=check|on-demand|no'. If not set, 'no' is used by default, unless 'submodule.recurse' is set (in which case a 'true' value means 'on-demand')`,
				}, {
					Name:        []string{`push.useBitmaps`},
					Description: `If set to "false", disable use of bitmaps for "git push" even if "pack.useBitmaps" is "true", without preventing other git operations from using bitmaps. Default is true`,
				}, {
					Name:        []string{`push.useForceIfIncludes`},
					Description: `If set to "true", it is equivalent to specifying "--force-if-includes" as an option to git-push[1] in the command line. Adding "--no-force-if-includes" at the time of push overrides this configuration setting`,
				}, {
					Name:        []string{`rebase.abbreviateCommands`},
					Description: `If set to true, "git rebase" will use abbreviated command names in the todo list resulting in something like this:`,
				}, {
					Name:        []string{`rebase.autoSquash`},
					Description: `If set to true enable "--autosquash" option by default`,
				}, {
					Name:        []string{`rebase.autoStash`},
					Description: `When set to true, automatically create a temporary stash entry before the operation begins, and apply it after the operation ends. This means that you can run rebase on a dirty worktree. However, use with care: the final stash application after a successful rebase might result in non-trivial conflicts. This option can be overridden by the "--no-autostash" and "--autostash" options of git-rebase[1]. Defaults to false`,
				}, {
					Name:        []string{`rebase.backend`},
					Description: `Default backend to use for rebasing. Possible choices are 'apply' or 'merge'. In the future, if the merge backend gains all remaining capabilities of the apply backend, this setting may become unused`,
				}, {
					Name:        []string{`rebase.forkPoint`},
					Description: `If set to false set "--no-fork-point" option by default`,
				}, {
					Name:        []string{`rebase.instructionFormat`},
					Description: `A format string, as specified in git-log[1], to be used for the todo list during an interactive rebase. The format will automatically have the long commit hash prepended to the format`,
				}, {
					Name:        []string{`rebase.missingCommitsCheck`},
					Description: `If set to "warn", git rebase -i will print a warning if some commits are removed (e.g. a line was deleted), however the rebase will still proceed. If set to "error", it will print the previous warning and stop the rebase, 'git rebase --edit-todo' can then be used to correct the error. If set to "ignore", no checking is done. To drop a commit without warning or error, use the "drop" command in the todo list. Defaults to "ignore"`,
				}, {
					Name:        []string{`rebase.rescheduleFailedExec`},
					Description: `Automatically reschedule "exec" commands that failed. This only makes sense in interactive mode (or when an "--exec" option was provided). This is the same as specifying the "--reschedule-failed-exec" option`,
				}, {
					Name:        []string{`rebase.stat`},
					Description: `Whether to show a diffstat of what changed upstream since the last rebase. False by default`,
				}, {
					Name:        []string{`rebase.updateRefs`},
					Description: `If set to true enable "--update-refs" option by default`,
				}, {
					Name:        []string{`receive.advertiseAtomic`},
					Description: `By default, git-receive-pack will advertise the atomic push capability to its clients. If you don't want to advertise this capability, set this variable to false`,
				}, {
					Name:        []string{`receive.advertisePushOptions`},
					Description: `When set to true, git-receive-pack will advertise the push options capability to its clients. False by default`,
				}, {
					Name:        []string{`receive.autogc`},
					Description: `By default, git-receive-pack will run "git-gc --auto" after receiving data from git-push and updating refs. You can stop it by setting this variable to false`,
				}, {
					Name:        []string{`receive.certNonceSeed`},
					Description: `By setting this variable to a string, "git receive-pack" will accept a "git push --signed" and verifies it by using a "nonce" protected by HMAC using this string as a secret key`,
				}, {
					Name:        []string{`receive.certNonceSlop`},
					Description: `When a "git push --signed" sent a push certificate with a "nonce" that was issued by a receive-pack serving the same repository within this many seconds, export the "nonce" found in the certificate to "GIT_PUSH_CERT_NONCE" to the hooks (instead of what the receive-pack asked the sending side to include). This may allow writing checks in "pre-receive" and "post-receive" a bit easier. Instead of checking "GIT_PUSH_CERT_NONCE_SLOP" environment variable that records by how many seconds the nonce is stale to decide if they want to accept the certificate, they only can check "GIT_PUSH_CERT_NONCE_STATUS" is "OK"`,
				}, {
					Name:        []string{`receive.denyCurrentBranch`},
					Description: `If set to true or "refuse", git-receive-pack will deny a ref update to the currently checked out branch of a non-bare repository. Such a push is potentially dangerous because it brings the HEAD out of sync with the index and working tree. If set to "warn", print a warning of such a push to stderr, but allow the push to proceed. If set to false or "ignore", allow such pushes with no message. Defaults to "refuse"`,
				}, {
					Name:        []string{`receive.denyDeleteCurrent`},
					Description: `If set to true, git-receive-pack will deny a ref update that deletes the currently checked out branch of a non-bare repository`,
				}, {
					Name:        []string{`receive.denyDeletes`},
					Description: `If set to true, git-receive-pack will deny a ref update that deletes the ref. Use this to prevent such a ref deletion via a push`,
				}, {
					Name:        []string{`receive.denyNonFastForwards`},
					Description: `If set to true, git-receive-pack will deny a ref update which is not a fast-forward. Use this to prevent such an update via a push, even if that push is forced. This configuration variable is set when initializing a shared repository`,
				}, {
					Name:        []string{`receive.fsck.<msg-id>`},
					Description: `Acts like "fsck.<msg-id>", but is used by git-receive-pack[1] instead of git-fsck[1]. See the "fsck.<msg-id>" documentation for details`,
				}, {
					Name:        []string{`receive.fsck.skipList`},
					Description: `Acts like "fsck.skipList", but is used by git-receive-pack[1] instead of git-fsck[1]. See the "fsck.skipList" documentation for details`,
				}, {
					Name:        []string{`receive.fsckObjects`},
					Description: `If it is set to true, git-receive-pack will check all received objects. See "transfer.fsckObjects" for what's checked. Defaults to false. If not set, the value of "transfer.fsckObjects" is used instead`,
				}, {
					Name:        []string{`receive.hideRefs`},
					Description: `This variable is the same as "transfer.hideRefs", but applies only to "receive-pack" (and so affects pushes, but not fetches). An attempt to update or delete a hidden ref by "git push" is rejected`,
				}, {
					Name:        []string{`receive.keepAlive`},
					Description: `After receiving the pack from the client, "receive-pack" may produce no output (if "--quiet" was specified) while processing the pack, causing some networks to drop the TCP connection. With this option set, if "receive-pack" does not transmit any data in this phase for "receive.keepAlive" seconds, it will send a short keepalive packet. The default is 5 seconds; set to 0 to disable keepalives entirely`,
				}, {
					Name:        []string{`receive.maxInputSize`},
					Description: `If the size of the incoming pack stream is larger than this limit, then git-receive-pack will error out, instead of accepting the pack file. If not set or set to 0, then the size is unlimited`,
				}, {
					Name:        []string{`receive.procReceiveRefs`},
					Description: `This is a multi-valued variable that defines reference prefixes to match the commands in "receive-pack". Commands matching the prefixes will be executed by an external hook "proc-receive", instead of the internal "execute_commands" function. If this variable is not defined, the "proc-receive" hook will never be used, and all commands will be executed by the internal "execute_commands" function`,
				}, {
					Name:        []string{`receive.shallowUpdate`},
					Description: `If set to true, .git/shallow can be updated when new refs require new shallow roots. Otherwise those refs are rejected`,
				}, {
					Name:        []string{`receive.unpackLimit`},
					Description: `If the number of objects received in a push is below this limit then the objects will be unpacked into loose object files. However if the number of received objects equals or exceeds this limit then the received pack will be stored as a pack, after adding any missing delta bases. Storing the pack from a push can make the push operation complete faster, especially on slow filesystems. If not set, the value of "transfer.unpackLimit" is used instead`,
				}, {
					Name:        []string{`receive.updateServerInfo`},
					Description: `If set to true, git-receive-pack will run git-update-server-info after receiving data from git-push and updating refs`,
				}, {
					Name:        []string{`remote.<name>.fetch`},
					Description: `The default set of "refspec" for git-fetch[1]. See git-fetch[1]`,
				}, {
					Name:        []string{`remote.<name>.mirror`},
					Description: `If true, pushing to this remote will automatically behave as if the "--mirror" option was given on the command line`,
				}, {
					Name:        []string{`remote.<name>.partialclonefilter`},
					Description: `The filter that will be applied when fetching from this promisor remote. Changing or clearing this value will only affect fetches for new commits. To fetch associated objects for commits already present in the local object database, use the "--refetch" option of git-fetch[1]`,
				}, {
					Name:        []string{`remote.<name>.promisor`},
					Description: `When set to true, this remote will be used to fetch promisor objects`,
				}, {
					Name:        []string{`remote.<name>.proxy`},
					Description: `For remotes that require curl (http, https and ftp), the URL to the proxy to use for that remote. Set to the empty string to disable proxying for that remote`,
				}, {
					Name:        []string{`remote.<name>.proxyAuthMethod`},
					Description: `For remotes that require curl (http, https and ftp), the method to use for authenticating against the proxy in use (probably set in "remote.<name>.proxy"). See "http.proxyAuthMethod"`,
				}, {
					Name:        []string{`remote.<name>.prune`},
					Description: `When set to true, fetching from this remote by default will also remove any remote-tracking references that no longer exist on the remote (as if the "--prune" option was given on the command line). Overrides "fetch.prune" settings, if any`,
				}, {
					Name:        []string{`remote.<name>.pruneTags`},
					Description: `When set to true, fetching from this remote by default will also remove any local tags that no longer exist on the remote if pruning is activated in general via "remote.<name>.prune", "fetch.prune" or "--prune". Overrides "fetch.pruneTags" settings, if any`,
				}, {
					Name:        []string{`remote.<name>.push`},
					Description: `The default set of "refspec" for git-push[1]. See git-push[1]`,
				}, {
					Name:        []string{`remote.<name>.pushurl`},
					Description: `The push URL of a remote repository. See git-push[1]`,
				}, {
					Name:        []string{`remote.<name>.receivepack`},
					Description: `The default program to execute on the remote side when pushing. See option --receive-pack of git-push[1]`,
				}, {
					Name:        []string{`remote.<name>.skipDefaultUpdate`},
					Description: `If true, this remote will be skipped by default when updating using git-fetch[1] or the "update" subcommand of git-remote[1]`,
				}, {
					Name:        []string{`remote.<name>.skipFetchAll`},
					Description: `If true, this remote will be skipped by default when updating using git-fetch[1] or the "update" subcommand of git-remote[1]`,
				}, {
					Name:        []string{`remote.<name>.tagOpt`},
					Description: `Setting this value to --no-tags disables automatic tag following when fetching from remote <name>. Setting it to --tags will fetch every tag from remote <name>, even if they are not reachable from remote branch heads. Passing these flags directly to git-fetch[1] can override this setting. See options --tags and --no-tags of git-fetch[1]`,
				}, {
					Name:        []string{`remote.<name>.uploadpack`},
					Description: `The default program to execute on the remote side when fetching. See option --upload-pack of git-fetch-pack[1]`,
				}, {
					Name:        []string{`remote.<name>.url`},
					Description: `The URL of a remote repository. See git-fetch[1] or git-push[1]`,
				}, {
					Name:        []string{`remote.<name>.vcs`},
					Description: `Setting this to a value <vcs> will cause Git to interact with the remote with the git-remote-<vcs> helper`,
				}, {
					Name:        []string{`remote.pushDefault`},
					Description: `The remote to push to by default. Overrides "branch.<name>.remote" for all branches, and is overridden by "branch.<name>.pushRemote" for specific branches`,
				}, {
					Name:        []string{`remotes.<group>`},
					Description: `The list of remotes which are fetched by "git remote update <group>". See git-remote[1]`,
				}, {
					Name:        []string{`repack.cruftThreads`},
					Description: `Parameters used by git-pack-objects[1] when generating a cruft pack and the respective parameters are not given over the command line. See similarly named "pack.*" configuration variables for defaults and meaning`,
				}, {
					Name:        []string{`repack.packKeptObjects`},
					Description: `If set to true, makes "git repack" act as if "--pack-kept-objects" was passed. See git-repack[1] for details. Defaults to "false" normally, but "true" if a bitmap index is being written (either via "--write-bitmap-index" or "repack.writeBitmaps")`,
				}, {
					Name:        []string{`repack.updateServerInfo`},
					Description: `If set to false, git-repack[1] will not run git-update-server-info[1]. Defaults to true. Can be overridden when true by the "-n" option of git-repack[1]`,
				}, {
					Name:        []string{`repack.useDeltaBaseOffset`},
					Description: `By default, git-repack[1] creates packs that use delta-base offset. If you need to share your repository with Git older than version 1.4.4, either directly or via a dumb protocol such as http, then you need to set this option to "false" and repack. Access from old Git versions over the native protocol are unaffected by this option`,
				}, {
					Name:        []string{`repack.useDeltaIslands`},
					Description: `If set to true, makes "git repack" act as if "--delta-islands" was passed. Defaults to "false"`,
				}, {
					Name:        []string{`repack.writeBitmaps`},
					Description: `When true, git will write a bitmap index when packing all objects to disk (e.g., when "git repack -a" is run). This index can speed up the "counting objects" phase of subsequent packs created for clones and fetches, at the cost of some disk space and extra time spent on the initial repack. This has no effect if multiple packfiles are created. Defaults to true on bare repos, false otherwise`,
				}, {
					Name:        []string{`rerere.autoUpdate`},
					Description: `When set to true, "git-rerere" updates the index with the resulting contents after it cleanly resolves conflicts using previously recorded resolution. Defaults to false`,
				}, {
					Name:        []string{`rerere.enabled`},
					Description: `Activate recording of resolved conflicts, so that identical conflict hunks can be resolved automatically, should they be encountered again. By default, git-rerere[1] is enabled if there is an "rr-cache" directory under the "$GIT_DIR", e.g. if "rerere" was previously used in the repository`,
				}, {
					Name:        []string{`revert.reference`},
					Description: `Setting this variable to true makes "git revert" behave as if the "--reference" option is given`,
				}, {
					Name:        []string{`safe.bareRepository`},
					Description: `Specifies which bare repositories Git will work with. The currently supported values are:`,
				}, {
					Name:        []string{`safe.directory`},
					Description: `These config entries specify Git-tracked directories that are considered safe even if they are owned by someone other than the current user. By default, Git will refuse to even parse a Git config of a repository owned by someone else, let alone run its hooks, and this config setting allows users to specify exceptions, e.g. for intentionally shared repositories (see the "--shared" option in git-init[1])`,
				}, {
					Name:        []string{`sendemail.forbidSendmailVariables`},
					Description: `To avoid common misconfiguration mistakes, git-send-email[1] will abort with a warning if any configuration options for "sendmail" exist. Set this variable to bypass the check`,
				}, {
					Name:        []string{`sendemail.identity`},
					Description: `A configuration identity. When given, causes values in the 'sendemail.<identity>' subsection to take precedence over values in the 'sendemail' section. The default identity is the value of "sendemail.identity"`,
				}, {
					Name:        []string{`sendemail.signedoffcc`},
					Description: `Deprecated alias for "sendemail.signedoffbycc"`,
				}, {
					Name:        []string{`sendemail.smtpBatchSize`},
					Description: `Number of messages to be sent per connection, after that a relogin will happen. If the value is 0 or undefined, send all messages in one connection. See also the "--batch-size" option of git-send-email[1]`,
				}, {
					Name:        []string{`sendemail.smtpEncryption`},
					Description: `See git-send-email[1] for description. Note that this setting is not subject to the 'identity' mechanism`,
				}, {
					Name:        []string{`sendemail.smtpReloginDelay`},
					Description: `Seconds wait before reconnecting to smtp server. See also the "--relogin-delay" option of git-send-email[1]`,
				}, {
					Name:        []string{`sendemail.smtpsslcertpath`},
					Description: `Path to ca-certificates (either a directory or a single file). Set it to an empty string to disable certificate verification`,
				}, {
					Name:        []string{`sendemail.xmailer`},
					Description: `See git-send-email[1] for description`,
				}, {
					Name:        []string{`sequence.editor`},
					Description: `Text editor used by "git rebase -i" for editing the rebase instruction file. The value is meant to be interpreted by the shell when it is used. It can be overridden by the "GIT_SEQUENCE_EDITOR" environment variable. When not configured the default commit message editor is used instead`,
				}, {
					Name:        []string{`sendemail.<identity>.forbidSendmailVariables`},
					Description: `To avoid common misconfiguration mistakes, git-send-email[1] will abort with a warning if any configuration options for "sendmail" exist. Set this variable to bypass the check`,
				}, {
					Name:        []string{`sendemail.<identity>.signedoffcc`},
					Description: `Deprecated alias for "sendemail.signedoffbycc"`,
				}, {
					Name:        []string{`sendemail.<identity>.smtpBatchSize`},
					Description: `Number of messages to be sent per connection, after that a relogin will happen. If the value is 0 or undefined, send all messages in one connection. See also the "--batch-size" option of git-send-email[1]`,
				}, {
					Name:        []string{`sendemail.<identity>.smtpEncryption`},
					Description: `See git-send-email[1] for description. Note that this setting is not subject to the 'identity' mechanism`,
				}, {
					Name:        []string{`sendemail.<identity>.smtpReloginDelay`},
					Description: `Seconds wait before reconnecting to smtp server. See also the "--relogin-delay" option of git-send-email[1]`,
				}, {
					Name:        []string{`sendemail.<identity>.smtpsslcertpath`},
					Description: `Path to ca-certificates (either a directory or a single file). Set it to an empty string to disable certificate verification`,
				}, {
					Name:        []string{`sendemail.<identity>.xmailer`},
					Description: `See git-send-email[1] for description`,
				}, {
					Name:        []string{`sequence.<identity>.editor`},
					Description: `Text editor used by "git rebase -i" for editing the rebase instruction file. The value is meant to be interpreted by the shell when it is used. It can be overridden by the "GIT_SEQUENCE_EDITOR" environment variable. When not configured the default commit message editor is used instead`,
				}, {
					Name:        []string{`showBranch.default`},
					Description: `The default set of branches for git-show-branch[1]. See git-show-branch[1]`,
				}, {
					Name:        []string{`sparse.expectFilesOutsideOfPatterns`},
					Description: `Typically with sparse checkouts, files not matching any sparsity patterns are marked with a SKIP_WORKTREE bit in the index and are missing from the working tree. Accordingly, Git will ordinarily check whether files with the SKIP_WORKTREE bit are in fact present in the working tree contrary to expectations. If Git finds any, it marks those paths as present by clearing the relevant SKIP_WORKTREE bits. This option can be used to tell Git that such present-despite-skipped files are expected and to stop checking for them`,
				}, {
					Name:        []string{`splitIndex.maxPercentChange`},
					Description: `When the split index feature is used, this specifies the percent of entries the split index can contain compared to the total number of entries in both the split index and the shared index before a new shared index is written. The value should be between 0 and 100. If the value is 0 then a new shared index is always written, if it is 100 a new shared index is never written. By default the value is 20, so a new shared index is written if the number of entries in the split index would be greater than 20 percent of the total number of entries. See git-update-index[1]`,
				}, {
					Name:        []string{`splitIndex.sharedIndexExpire`},
					Description: `When the split index feature is used, shared index files that were not modified since the time this variable specifies will be removed when a new shared index file is created. The value "now" expires all entries immediately, and "never" suppresses expiration altogether. The default value is "2.weeks.ago". Note that a shared index file is considered modified (for the purpose of expiration) each time a new split-index file is either created based on it or read from it. See git-update-index[1]`,
				}, {
					Name:        []string{`ssh.variant`},
					Description: `By default, Git determines the command line arguments to use based on the basename of the configured SSH command (configured using the environment variable "GIT_SSH" or "GIT_SSH_COMMAND" or the config setting "core.sshCommand"). If the basename is unrecognized, Git will attempt to detect support of OpenSSH options by first invoking the configured SSH command with the "-G" (print configuration) option and will subsequently use OpenSSH options (if that is successful) or no options besides the host and remote command (if it fails)`,
				}, {
					Name:        []string{`stash.showIncludeUntracked`},
					Description: `If this is set to true, the "git stash show" command will show the untracked files of a stash entry. Defaults to false. See description of 'show' command in git-stash[1]`,
				}, {
					Name:        []string{`stash.showPatch`},
					Description: `If this is set to true, the "git stash show" command without an option will show the stash entry in patch form. Defaults to false. See description of 'show' command in git-stash[1]`,
				}, {
					Name:        []string{`stash.showStat`},
					Description: `If this is set to true, the "git stash show" command without an option will show diffstat of the stash entry. Defaults to true. See description of 'show' command in git-stash[1]`,
				}, {
					Name:        []string{`status.aheadBehind`},
					Description: `Set to true to enable "--ahead-behind" and false to enable "--no-ahead-behind" by default in git-status[1] for non-porcelain status formats. Defaults to true`,
				}, {
					Name:        []string{`status.branch`},
					Description: `Set to true to enable --branch by default in git-status[1]. The option --no-branch takes precedence over this variable`,
				}, {
					Name:        []string{`status.displayCommentPrefix`},
					Description: `If set to true, git-status[1] will insert a comment prefix before each output line (starting with "core.commentChar", i.e. "#" by default). This was the behavior of git-status[1] in Git 1.8.4 and previous. Defaults to false`,
				}, {
					Name:        []string{`status.relativePaths`},
					Description: `By default, git-status[1] shows paths relative to the current directory. Setting this variable to "false" shows paths relative to the repository root (this was the default for Git prior to v1.5.4)`,
				}, {
					Name:        []string{`status.renameLimit`},
					Description: `The number of files to consider when performing rename detection in git-status[1] and git-commit[1]. Defaults to the value of diff.renameLimit`,
				}, {
					Name:        []string{`status.renames`},
					Description: `Whether and how Git detects renames in git-status[1] and git-commit[1] . If set to "false", rename detection is disabled. If set to "true", basic rename detection is enabled. If set to "copies" or "copy", Git will detect copies, as well. Defaults to the value of diff.renames`,
				}, {
					Name:        []string{`status.short`},
					Description: `Set to true to enable --short by default in git-status[1]. The option --no-short takes precedence over this variable`,
				}, {
					Name:        []string{`status.showStash`},
					Description: `If set to true, git-status[1] will display the number of entries currently stashed away. Defaults to false`,
				}, {
					Name:        []string{`status.showUntrackedFiles`},
					Description: `By default, git-status[1] and git-commit[1] show files which are not currently tracked by Git. Directories which contain only untracked files, are shown with the directory name only. Showing untracked files means that Git needs to lstat() all the files in the whole repository, which might be slow on some systems. So, this variable controls how the commands displays the untracked files. Possible values are:`,
				}, {
					Name:        []string{`status.submoduleSummary`},
					Description: `Defaults to false. If this is set to a non zero number or true (identical to -1 or an unlimited number), the submodule summary will be enabled and a summary of commits for modified submodules will be shown (see --summary-limit option of git-submodule[1]). Please note that the summary output command will be suppressed for all submodules when "diff.ignoreSubmodules" is set to 'all' or only for those submodules where "submodule.<name>.ignore=all". The only exception to that rule is that status and commit will show staged submodule changes. To also view the summary for ignored submodules you can either use the --ignore-submodules=dirty command-line option or the 'git submodule summary' command, which shows a similar output but does not honor these settings`,
				}, {
					Name:        []string{`submodule.<name>.active`},
					Description: `Boolean value indicating if the submodule is of interest to git commands. This config option takes precedence over the submodule.active config option. See gitsubmodules[7] for details`,
				}, {
					Name:        []string{`submodule.<name>.branch`},
					Description: `The remote branch name for a submodule, used by "git submodule update --remote". Set this option to override the value found in the ".gitmodules" file. See git-submodule[1] and gitmodules[5] for details`,
				}, {
					Name:        []string{`submodule.<name>.fetchRecurseSubmodules`},
					Description: `This option can be used to control recursive fetching of this submodule. It can be overridden by using the --[no-]recurse-submodules command-line option to "git fetch" and "git pull". This setting will override that from in the gitmodules[5] file`,
				}, {
					Name:        []string{`submodule.<name>.ignore`},
					Description: `Defines under what circumstances "git status" and the diff family show a submodule as modified. When set to "all", it will never be considered modified (but it will nonetheless show up in the output of status and commit when it has been staged), "dirty" will ignore all changes to the submodules work tree and takes only differences between the HEAD of the submodule and the commit recorded in the superproject into account. "untracked" will additionally let submodules with modified tracked files in their work tree show up. Using "none" (the default when this option is not set) also shows submodules that have untracked files in their work tree as changed. This setting overrides any setting made in .gitmodules for this submodule, both settings can be overridden on the command line by using the "--ignore-submodules" option. The 'git submodule' commands are not affected by this setting`,
				}, {
					Name:        []string{`submodule.<name>.update`},
					Description: `The method by which a submodule is updated by 'git submodule update', which is the only affected command, others such as 'git checkout --recurse-submodules' are unaffected. It exists for historical reasons, when 'git submodule' was the only command to interact with submodules; settings like "submodule.active" and "pull.rebase" are more specific. It is populated by "git submodule init" from the gitmodules[5] file. See description of 'update' command in git-submodule[1]`,
				}, {
					Name:        []string{`submodule.<name>.url`},
					Description: `The URL for a submodule. This variable is copied from the .gitmodules file to the git config via 'git submodule init'. The user can change the configured URL before obtaining the submodule via 'git submodule update'. If neither submodule.<name>.active or submodule.active are set, the presence of this variable is used as a fallback to indicate whether the submodule is of interest to git commands. See git-submodule[1] and gitmodules[5] for details`,
				}, {
					Name:        []string{`submodule.active`},
					Description: `A repeated field which contains a pathspec used to match against a submodule's path to determine if the submodule is of interest to git commands. See gitsubmodules[7] for details`,
				}, {
					Name:        []string{`submodule.alternateErrorStrategy`},
					Description: `Specifies how to treat errors with the alternates for a submodule as computed via "submodule.alternateLocation". Possible values are "ignore", "info", "die". Default is "die". Note that if set to "ignore" or "info", and if there is an error with the computed alternate, the clone proceeds as if no alternate was specified`,
				}, {
					Name:        []string{`submodule.alternateLocation`},
					Description: `Specifies how the submodules obtain alternates when submodules are cloned. Possible values are "no", "superproject". By default "no" is assumed, which doesn't add references. When the value is set to "superproject" the submodule to be cloned computes its alternates location relative to the superprojects alternate`,
				}, {
					Name:        []string{`submodule.fetchJobs`},
					Description: `Specifies how many submodules are fetched/cloned at the same time. A positive integer allows up to that number of submodules fetched in parallel. A value of 0 will give some reasonable default. If unset, it defaults to 1`,
				}, {
					Name:        []string{`submodule.propagateBranches`},
					Description: `[EXPERIMENTAL] A boolean that enables branching support when using "--recurse-submodules" or "submodule.recurse=true". Enabling this will allow certain commands to accept "--recurse-submodules" and certain commands that already accept "--recurse-submodules" will now consider branches. Defaults to false`,
				}, {
					Name:        []string{`submodule.recurse`},
					Description: `A boolean indicating if commands should enable the "--recurse-submodules" option by default. Defaults to false`,
				}, {
					Name:        []string{`tag.forceSignAnnotated`},
					Description: `A boolean to specify whether annotated tags created should be GPG signed. If "--annotate" is specified on the command line, it takes precedence over this option`,
				}, {
					Name:        []string{`tag.gpgSign`},
					Description: `A boolean to specify whether all tags should be GPG signed. Use of this option when running in an automated script can result in a large number of tags being signed. It is therefore convenient to use an agent to avoid typing your gpg passphrase several times. Note that this option doesn't affect tag signing behavior enabled by "-u <keyid>" or "--local-user=<keyid>" options`,
				}, {
					Name:        []string{`tag.sort`},
					Description: `This variable controls the sort ordering of tags when displayed by git-tag[1]. Without the "--sort=<value>" option provided, the value of this variable will be used as the default`,
				}, {
					Name:        []string{`tar.umask`},
					Description: `This variable can be used to restrict the permission bits of tar archive entries. The default is 0002, which turns off the world write bit. The special value "user" indicates that the archiving user's umask will be used instead. See umask(2) and git-archive[1]`,
				}, {
					Name:        []string{`trace2.configParams`},
					Description: `A comma-separated list of patterns of "important" config settings that should be recorded in the trace2 output. For example, "core.*,remote.*.url" would cause the trace2 output to contain events listing each configured remote. May be overridden by the "GIT_TRACE2_CONFIG_PARAMS" environment variable. Unset by default`,
				}, {
					Name:        []string{`trace2.destinationDebug`},
					Description: `Boolean. When true Git will print error messages when a trace target destination cannot be opened for writing. By default, these errors are suppressed and tracing is silently disabled. May be overridden by the "GIT_TRACE2_DST_DEBUG" environment variable`,
				}, {
					Name:        []string{`trace2.envVars`},
					Description: `A comma-separated list of "important" environment variables that should be recorded in the trace2 output. For example, "GIT_HTTP_USER_AGENT,GIT_CONFIG" would cause the trace2 output to contain events listing the overrides for HTTP user agent and the location of the Git configuration file (assuming any are set). May be overridden by the "GIT_TRACE2_ENV_VARS" environment variable. Unset by default`,
				}, {
					Name:        []string{`trace2.eventBrief`},
					Description: `Boolean. When true "time", "filename", and "line" fields are omitted from event output. May be overridden by the "GIT_TRACE2_EVENT_BRIEF" environment variable. Defaults to false`,
				}, {
					Name:        []string{`trace2.eventNesting`},
					Description: `Integer. Specifies desired depth of nested regions in the event output. Regions deeper than this value will be omitted. May be overridden by the "GIT_TRACE2_EVENT_NESTING" environment variable. Defaults to 2`,
				}, {
					Name:        []string{`trace2.eventTarget`},
					Description: `This variable controls the event target destination. It may be overridden by the "GIT_TRACE2_EVENT" environment variable. The following table shows possible values`,
				}, {
					Name:        []string{`trace2.maxFiles`},
					Description: `Integer. When writing trace files to a target directory, do not write additional traces if we would exceed this many files. Instead, write a sentinel file that will block further tracing to this directory. Defaults to 0, which disables this check`,
				}, {
					Name:        []string{`trace2.normalBrief`},
					Description: `Boolean. When true "time", "filename", and "line" fields are omitted from normal output. May be overridden by the "GIT_TRACE2_BRIEF" environment variable. Defaults to false`,
				}, {
					Name:        []string{`trace2.normalTarget`},
					Description: `This variable controls the normal target destination. It may be overridden by the "GIT_TRACE2" environment variable. The following table shows possible values`,
				}, {
					Name:        []string{`trace2.perfBrief`},
					Description: `Boolean. When true "time", "filename", and "line" fields are omitted from PERF output. May be overridden by the "GIT_TRACE2_PERF_BRIEF" environment variable. Defaults to false`,
				}, {
					Name:        []string{`trace2.perfTarget`},
					Description: `This variable controls the performance target destination. It may be overridden by the "GIT_TRACE2_PERF" environment variable. The following table shows possible values`,
				}, {
					Name:        []string{`transfer.advertiseSID`},
					Description: `Boolean. When true, client and server processes will advertise their unique session IDs to their remote counterpart. Defaults to false`,
				}, {
					Name:        []string{`transfer.credentialsInUrl`},
					Description: `A configured URL can contain plaintext credentials in the form "<protocol>://<user>:<password>@<domain>/<path>". You may want to warn or forbid the use of such configuration (in favor of using git-credential[1]). This will be used on git-clone[1], git-fetch[1], git-push[1], and any other direct use of the configured URL`,
				}, {
					Name:        []string{`transfer.fsckObjects`},
					Description: `When "fetch.fsckObjects" or "receive.fsckObjects" are not set, the value of this variable is used instead. Defaults to false`,
				}, {
					Name:        []string{`transfer.hideRefs`},
					Description: `String(s) "receive-pack" and "upload-pack" use to decide which refs to omit from their initial advertisements. Use more than one definition to specify multiple prefix strings. A ref that is under the hierarchies listed in the value of this variable is excluded, and is hidden when responding to "git push" or "git fetch". See "receive.hideRefs" and "uploadpack.hideRefs" for program-specific versions of this config`,
				}, {
					Name:        []string{`transfer.unpackLimit`},
					Description: `When "fetch.unpackLimit" or "receive.unpackLimit" are not set, the value of this variable is used instead. The default value is 100`,
				}, {
					Name:        []string{`uploadarchive.allowUnreachable`},
					Description: `If true, allow clients to use "git archive --remote" to request any tree, whether reachable from the ref tips or not. See the discussion in the "SECURITY" section of git-upload-archive[1] for more details. Defaults to "false"`,
				}, {
					Name:        []string{`uploadpack.allowAnySHA1InWant`},
					Description: `Allow "upload-pack" to accept a fetch request that asks for any object at all. Defaults to "false"`,
				}, {
					Name:        []string{`uploadpack.allowFilter`},
					Description: `If this option is set, "upload-pack" will support partial clone and partial fetch object filtering`,
				}, {
					Name:        []string{`uploadpack.allowReachableSHA1InWant`},
					Description: `Allow "upload-pack" to accept a fetch request that asks for an object that is reachable from any ref tip. However, note that calculating object reachability is computationally expensive. Defaults to "false". Even if this is false, a client may be able to steal objects via the techniques described in the "SECURITY" section of the gitnamespaces[7] man page; it's best to keep private data in a separate repository`,
				}, {
					Name:        []string{`uploadpack.allowRefInWant`},
					Description: `If this option is set, "upload-pack" will support the "ref-in-want" feature of the protocol version 2 "fetch" command. This feature is intended for the benefit of load-balanced servers which may not have the same view of what OIDs their refs point to due to replication delay`,
				}, {
					Name:        []string{`uploadpack.allowTipSHA1InWant`},
					Description: `When "uploadpack.hideRefs" is in effect, allow "upload-pack" to accept a fetch request that asks for an object at the tip of a hidden ref (by default, such a request is rejected). See also "uploadpack.hideRefs". Even if this is false, a client may be able to steal objects via the techniques described in the "SECURITY" section of the gitnamespaces[7] man page; it's best to keep private data in a separate repository`,
				}, {
					Name:        []string{`uploadpack.hideRefs`},
					Description: `This variable is the same as "transfer.hideRefs", but applies only to "upload-pack" (and so affects only fetches, not pushes). An attempt to fetch a hidden ref by "git fetch" will fail. See also "uploadpack.allowTipSHA1InWant"`,
				}, {
					Name:        []string{`uploadpack.keepAlive`},
					Description: `When "upload-pack" has started "pack-objects", there may be a quiet period while "pack-objects" prepares the pack. Normally it would output progress information, but if "--quiet" was used for the fetch, "pack-objects" will output nothing at all until the pack data begins. Some clients and networks may consider the server to be hung and give up. Setting this option instructs "upload-pack" to send an empty keepalive packet every "uploadpack.keepAlive" seconds. Setting this option to 0 disables keepalive packets entirely. The default is 5 seconds`,
				}, {
					Name:        []string{`uploadpack.packObjectsHook`},
					Description: `If this option is set, when "upload-pack" would run "git pack-objects" to create a packfile for a client, it will run this shell command instead. The "pack-objects" command and arguments it _would_ have run (including the "git pack-objects" at the beginning) are appended to the shell command. The stdin and stdout of the hook are treated as if "pack-objects" itself was run. I.e., "upload-pack" will feed input intended for "pack-objects" to the hook, and expects a completed packfile on stdout`,
				}, {
					Name:        []string{`uploadpackfilter.<filter>.allow`},
					Description: `Explicitly allow or ban the object filter corresponding to "<filter>", where "<filter>" may be one of: "blob:none", "blob:limit", "object:type", "tree", "sparse:oid", or "combine". If using combined filters, both "combine" and all of the nested filter kinds must be allowed. Defaults to "uploadpackfilter.allow"`,
				}, {
					Name:        []string{`uploadpackfilter.allow`},
					Description: `Provides a default value for unspecified object filters (see: the below configuration variable). If set to "true", this will also enable all filters which get added in the future. Defaults to "true"`,
				}, {
					Name:        []string{`uploadpackfilter.tree.maxDepth`},
					Description: `Only allow "--filter=tree:<n>" when "<n>" is no more than the value of "uploadpackfilter.tree.maxDepth". If set, this also implies "uploadpackfilter.tree.allow=true", unless this configuration variable had already been set. Has no effect if unset`,
				}, {
					Name:        []string{`url.<base>.insteadOf`},
					Description: `Any URL that starts with this value will be rewritten to start, instead, with <base>. In cases where some site serves a large number of repositories, and serves them with multiple access methods, and some users need to use different access methods, this feature allows people to specify any of the equivalent URLs and have Git automatically rewrite the URL to the best alternative for the particular user, even for a never-before-seen repository on the site. When more than one insteadOf strings match a given URL, the longest match is used`,
				}, {
					Name:        []string{`url.<base>.pushInsteadOf`},
					Description: `Any URL that starts with this value will not be pushed to; instead, it will be rewritten to start with <base>, and the resulting URL will be pushed to. In cases where some site serves a large number of repositories, and serves them with multiple access methods, some of which do not allow push, this feature allows people to specify a pull-only URL and have Git automatically use an appropriate URL to push, even for a never-before-seen repository on the site. When more than one pushInsteadOf strings match a given URL, the longest match is used. If a remote has an explicit pushurl, Git will ignore this setting for that remote`,
				}, {
					Name:        []string{`user.signingKey`},
					Description: `If git-tag[1] or git-commit[1] is not selecting the key you want it to automatically when creating a signed tag or commit, you can override the default selection with this variable. This option is passed unchanged to gpg's --local-user parameter, so you may specify a key using any method that gpg supports. If gpg.format is set to "ssh" this can contain the path to either your private ssh key or the public key when ssh-agent is used. Alternatively it can contain a public key prefixed with "key::" directly (e.g.: "key::ssh-rsa XXXXXX identifier"). The private key needs to be available via ssh-agent. If not set git will call gpg.ssh.defaultKeyCommand (e.g.: "ssh-add -L") and try to use the first key available. For backward compatibility, a raw key which begins with "ssh-", such as "ssh-rsa XXXXXX identifier", is treated as "key::ssh-rsa XXXXXX identifier", but this form is deprecated; use the "key::" form instead`,
				}, {
					Name:        []string{`user.useConfigOnly`},
					Description: `Instruct Git to avoid trying to guess defaults for "user.email" and "user.name", and instead retrieve the values only from the configuration. For example, if you have multiple email addresses and would like to use a different one for each repository, then with this configuration option set to "true" in the global config along with a name, Git will prompt you to set up an email before making new commits in a newly cloned repository. Defaults to "false"`,
				}, {
					Name:        []string{`versionsort.prereleaseSuffix`},
					Description: `Deprecated alias for "versionsort.suffix". Ignored if "versionsort.suffix" is set`,
				}, {
					Name:        []string{`versionsort.suffix`},
					Description: `Even when version sort is used in git-tag[1], tagnames with the same base version but different suffixes are still sorted lexicographically, resulting e.g. in prerelease tags appearing after the main release (e.g. "1.0-rc1" after "1.0"). This variable can be specified to determine the sorting order of tags with different suffixes`,
				}, {
					Name:        []string{`web.browser`},
					Description: `Specify a web browser that may be used by some commands. Currently only git-instaweb[1] and git-help[1] may use it`,
				}, {
					Name:        []string{`worktree.guessRemote`},
					Description: `If no branch is specified and neither "-b" nor "-B" nor "--detach" is used, then "git worktree add" defaults to creating a new branch from HEAD. If "worktree.guessRemote" is set to true, "worktree add" tries to find a remote-tracking branch whose name uniquely matches the new branch name. If such a branch exists, it is checked out and set as "upstream" for the new branch. If no such match can be found, it falls back to creating a new branch from the current HEAD`,
				}},
				Generator: nil, // TODO: port over generator
			}, {
				Name: "value",
			}},
			Options: []model.Option{{
				Name:        []string{"--local"},
				Description: `Default: write to the repository .git/config file`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{
						Name:        []string{`user.name`},
						Description: `Set config for username`,
					}, {
						Name:        []string{`user.email`},
						Description: `Set config for email`,
					}},
					IsVariadic: true,
				}},
			}, {
				Name:        []string{"--global"},
				Description: `For writing options: write to global ~/.gitconfig file rather than the repository .git/config`,
			}, {
				Name:        []string{"--replace-all"},
				Description: `Default behavior is to replace at most one line. This replaces all lines matc`,
			}, {
				Name:        []string{"--add"},
				Description: `Adds a new line to the option without altering any existing values. This is t`,
			}, {
				Name:        []string{"--get"},
				Description: `Get the value for a given key (optionally filtered by a regex matching the va`,
			}, {
				Name:        []string{"--get-all"},
				Description: `Like get, but returns all values for a multi-valued key`,
			}, {
				Name:        []string{"--get-regexp"},
				Description: `Like --get-all, but interprets the name as a regular expression and writes ou`,
				Args: []model.Arg{{
					Name: "regexp",
				}},
			}, {
				Name:        []string{"--get-urlmatch"},
				Description: `When given a two-part name section.key, the value for section..key whose part`,
				Args: []model.Arg{{
					Name: "name",
				}, {
					Name: "url",
				}},
			}, {
				Name:        []string{"--system"},
				Description: `For writing options: write to system-wide $(prefix)/etc/gitconfig rather than`,
			}, {
				Name:        []string{"--worktree"},
				Description: `Similar to --local except that.git/config.worktree is read from or written to`,
			}, {
				Name:        []string{"-f", "--file"},
				Description: `Use the given config file instead of the one specified by GIT_CONFIG`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "config-file",
				}},
			}, {
				Name:        []string{"--blob"},
				Description: `Similar to --file but use the given blob instead of a file. E.g. you can use`,
				Args: []model.Arg{{
					Name: "blob",
				}},
			}, {
				Name:        []string{"--remove-section"},
				Description: `Remove the given section from the configuration file`,
			}, {
				Name:        []string{"--rename-section"},
				Description: `Rename the given section to a new name`,
			}, {
				Name:        []string{"--unset"},
				Description: `Remove the line matching the key from config file`,
			}, {
				Name:        []string{"--unset-all"},
				Description: `Remove all lines matching the key from config file`,
			}, {
				Name:        []string{"-l", "--list"},
				Description: `List all variables set in config file, along with their values`,
			}, {
				Name:        []string{"--fixed-value"},
				Description: `When used with the value-pattern argument, treat value-pattern as an exact st`,
			}, {
				Name:        []string{"--type"},
				Description: `Git config will ensure that any input or output is valid under the given type`,
				Args: []model.Arg{{
					Name:        "type",
					Suggestions: []model.Suggestion{{Name: []string{`bool`}}, {Name: []string{`int`}}, {Name: []string{`bool-or-int`}}, {Name: []string{`path`}}, {Name: []string{`expiry-date`}}, {Name: []string{`color`}}},
				}},
			}, {
				Name:        []string{"--no-type"},
				Description: `Un-sets the previously set type specifier (if one was previously set). This o`,
			}, {
				Name:        []string{"-z", "--null"},
				Description: `For all options that output values and/or keys, always end values with the nu`,
			}, {
				Name:        []string{"--name-only"},
				Description: `Output only the names of config variables for --list or --get-regexp`,
			}, {
				Name:        []string{"--show-origin"},
				Description: `Augment the output of all queried config options with the origin type (file`,
			}, {
				Name:        []string{"--show-scope"},
				Description: `Similar to --show-origin in that it augments the output of all queried config`,
			}, {
				Name:        []string{"--get-colorbool"},
				Description: `Find the color setting for name (e.g. color.diff) and output "true" or "false`,
				Args: []model.Arg{{
					Name: "name",
				}},
			}, {
				Name:        []string{"--get-color"},
				Description: `Find the color configured for name (e.g. color.diff.new) and output it as the`,
				Args: []model.Arg{{
					Name: "name",
				}, {
					Name:       "default",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"-e", "--edit"},
				Description: `Opens an editor to modify the specified config file; either --system, --globa`,
			}, {
				Name:        []string{"--includes"},
				Description: `Respect include.* directives in config files when looking up values. Defaults`,
			}, {
				Name:        []string{"--no-includes"},
				Description: `Respect include.* directives in config files when looking up values. Defaults`,
			}, {
				Name:        []string{"--default"},
				Description: `When using --get, and the requested variable is not found, behave as if were`,
				Args: []model.Arg{{
					Name:       "value",
					IsOptional: true,
				}},
			}},
		}, {
			Name:        []string{"rebase"},
			Description: `Reapply commits on top of another base tip`,
			Args: []model.Arg{{
				Name: "base",
				Suggestions: []model.Suggestion{{
					Name:        []string{`-`},
					Description: `Use the last ref as the base`,
				}},
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}, {
				Name:           "new base",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}},
			Options: []model.Option{{
				Name:        []string{"--onto"},
				Description: `Starting point at which to create the new commits. If the --onto option is not specified, the starting point is <upstream>. May be any valid commit, and not just an existing branch name. As a special case, you may use 'A...B' as a shortcut for the merge base of A and B if there is exactly one merge base. You can leave out at most one of A and B, in which case it defaults to HEAD`,
				Args: []model.Arg{{
					Name:      "newbase",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--keep-base"},
				Description: `Set the starting point at which to create the new commits to the merge base of <upstream> <branch>. Running git rebase --keep-base <upstream> <branch> is equivalent to running git rebase --onto <upstream>…​ <upstream>. This option is useful in the case where one is developing a feature on top of an upstream branch. While the feature is being worked on, the upstream branch may advance and it may not be the best idea to keep rebasing on top of the upstream but to keep the base commit as-is. Although both this option and --fork-point find the merge base between <upstream> and <branch>, this option uses the merge base as the starting point on which new commits will be created, whereas --fork-point uses the merge base to determine the set of commits which will be rebased`,
			}, {
				Name:        []string{"--continue"},
				Description: `Restart the rebasing process after having resolved a merge conflict`,
			}, {
				Name:        []string{"--abort"},
				Description: `Abort the rebase operation and reset HEAD to the original branch. If <branch> was provided when the rebase operation was started, then HEAD will be reset to <branch>. Otherwise HEAD will be reset to where it was when the rebase operation was started`,
			}, {
				Name:        []string{"--quit"},
				Description: `Abort the rebase operation but HEAD is not reset back to the original branch. The index and working tree are also left unchanged as a result. If a temporary stash entry was created using --autostash, it will be saved to the stash list`,
			}, {
				Name:        []string{"--apply"},
				Description: `Use applying strategies to rebase (calling git-am internally). This option may become a no-op in the future once the merge backend handles everything the apply one does`,
			}, {
				Name:        []string{"--empty"},
				Description: `How to handle commits that are not empty to start and are not clean cherry-picks of any upstream commit, but which become empty after rebasing (because they contain a subset of already upstream changes). With drop (the default), commits that become empty are dropped. With keep, such commits are kept. With ask (implied by --interactive), the rebase will halt when an empty commit is applied allowing you to choose whether to drop it, edit files more, or just commit the empty changes. Other options, like --exec, will use the default of drop unless -i/--interactive is explicitly specified. Note that commits which start empty are kept (unless --no-keep-empty is specified), and commits which are clean cherry-picks (as determined by git log --cherry-mark ...) are detected and dropped as a preliminary step (unless --reapply-cherry-picks is passed)`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{Name: []string{`drop`}}, {Name: []string{`keep`}}, {Name: []string{`ask`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"--no-keep-empty"},
				Description: `Do not keep commits that start empty before the rebase (i.e. that do not change anything from its parent) in the result. The default is to keep commits which start empty, since creating such commits requires passing the --allow-empty override flag to git commit, signifying that a user is very intentionally creating such a commit and thus wants to keep it. Usage of this flag will probably be rare, since you can get rid of commits that start empty by just firing up an interactive rebase and removing the lines corresponding to the commits you don’t want. This flag exists as a convenient shortcut, such as for cases where external tools generate many empty commits and you want them all removed. For commits which do not start empty but become empty after rebasing, see the --empty flag`,
			}, {
				Name:        []string{"--keep-empty"},
				Description: `Keep commits that start empty before the rebase (i.e. that do not change anything from its parent) in the result. The default is to keep commits which start empty, since creating such commits requires passing the --allow-empty override flag to git commit, signifying that a user is very intentionally creating such a commit and thus wants to keep it. Usage of this flag will probably be rare, since you can get rid of commits that start empty by just firing up an interactive rebase and removing the lines corresponding to the commits you don’t want. This flag exists as a convenient shortcut, such as for cases where external tools generate many empty commits and you want them all removed. For commits which do not start empty but become empty after rebasing, see the --empty flag`,
			}, {
				Name:        []string{"--reapply-cherry-picks"},
				Description: `Reapply all clean cherry-picks of any upstream commit instead of preemptively dropping them. (If these commits then become empty after rebasing, because they contain a subset of already upstream changes, the behavior towards them is controlled by the --empty flag). By default (or if --no-reapply-cherry-picks is given), these commits will be automatically dropped. Because this necessitates reading all upstream commits, this can be expensive in repos with a large number of upstream commits that need to be read. --reapply-cherry-picks allows rebase to forgo reading all upstream commits, potentially improving performance`,
			}, {
				Name:        []string{"--no-reapply-cherry-picks"},
				Description: `Do not reapply all clean cherry-picks of any upstream commit instead of preemptively dropping them`,
			}, {
				Name:        []string{"--allow-empty-message"},
				Description: `No-op. Rebasing commits with an empty message used to fail and this option would override that behavior, allowing commits with empty messages to be rebased. Now commits with an empty message do not cause rebasing to halt`,
			}, {
				Name:        []string{"--skip"},
				Description: `Restart the rebasing process by skipping the current patch`,
			}, {
				Name:        []string{"--edit-todo"},
				Description: `Edit the todo list during an interactive rebase`,
			}, {
				Name:        []string{"--show-current-patch"},
				Description: `Show the current patch in an interactive rebase or when rebase is stopped because of conflicts. This is the equivalent of git show REBASE_HEAD`,
			}, {
				Name:        []string{"-m", "--merge"},
				Description: `Use merging strategies to rebase. When the recursive (default) merge strategy is used, this allows rebase to be aware of renames on the upstream side. This is the default. Note that a rebase merge works by replaying each commit from the working branch on top of the <upstream> branch. Because of this, when a merge conflict happens, the side reported as ours is the so-far rebased series, starting with <upstream>, and theirs is the working branch. In other words, the sides are swapped`,
			}, {
				Name:        []string{"-s", "--strategy"},
				Description: `Use the given merge strategy. If there is no -s option git merge-recursive is used instead. This implies --merge. Because git rebase replays each commit from the working branch on top of the <upstream> branch using the given strategy, using the ours strategy simply empties all patches from the <branch>, which makes little sense`,
				Args: []model.Arg{{
					Name:        "strategy",
					Suggestions: []model.Suggestion{{Name: []string{`resolve`}}, {Name: []string{`recursive`}}, {Name: []string{`octopus`}}, {Name: []string{`ours`}}, {Name: []string{`subtree`}}},
					IsVariadic:  true,
				}},
			}, {
				Name:        []string{"-X", "--strategy-option"},
				Description: `Pass the <strategy-option> through to the merge strategy. This implies --merge and, if no strategy has been specified, -s recursive. Note the reversal of ours and theirs as noted above for the -m option`,
				Args: []model.Arg{{
					Name:        "option",
					Suggestions: []model.Suggestion{{Name: []string{`ours`}}, {Name: []string{`theirs`}}, {Name: []string{`patience`}}, {Name: []string{`diff-algorithm`}}, {Name: []string{`diff-algorithm=patience`}}, {Name: []string{`diff-algorithm=minimal`}}, {Name: []string{`diff-algorithm=histogram`}}, {Name: []string{`diff-algorithm=myers`}}, {Name: []string{`ignore-space-change`}}, {Name: []string{`ignore-all-space`}}, {Name: []string{`ignore-space-at-eol`}}, {Name: []string{`ignore-cr-at-eol`}}, {Name: []string{`renormalize`}}, {Name: []string{`no-renormalize`}}, {Name: []string{`no-renames`}}, {Name: []string{`find-renames`}}, {Name: []string{`subtree`}}},
				}},
			}, {
				Name:        []string{"--rerere-autoupdate"},
				Description: `Allow the rerere mechanism to update the index with the result of auto-conflict resolution if possible`,
			}, {
				Name:        []string{"--no-rerere-autoupdate"},
				Description: `Allow the rerere mechanism to update the index with the result of auto-conflict resolution if possible`,
			}, {
				Name:        []string{"-S", "--gpg-sign"},
				Description: `GPG-sign commits. The keyid argument is optional and defaults to the committer identity; if specified, it must be stuck to the option without a space. --no-gpg-sign is useful to countermand both commit.gpgSign configuration variable, and earlier --gpg-sign`,
				Args: []model.Arg{{
					Name:       "keyid",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-gpg-sign"},
				Description: `Do not GPG-sign commits.--no-gpg-sign is useful to countermand both commit.gpgSign configuration variable, and earlier --gpg-sign`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Be quiet. Implies --no-stat`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose. Implies --stat`,
			}, {
				Name:        []string{"--stat"},
				Description: `Show a diffstat of what changed upstream since the last rebase. The diffstat is also controlled by the configuration option rebase.stat`,
			}, {
				Name:        []string{"-n", "--no-stat"},
				Description: `Do not show a diffstat as part of the rebase process`,
			}, {
				Name:        []string{"--no-verify"},
				Description: `This option bypasses the pre-rebase hook. See also githooks[5]`,
			}, {
				Name:        []string{"--verify"},
				Description: `Allows the pre-rebase hook to run, which is the default. This option can be used to override --no-verify. See also githooks[5]`,
			}, {
				Name:        []string{"-C"},
				Description: `Ensure at least <n> lines of surrounding context match before and after each change. When fewer lines of surrounding context exist they all must match. By default no context is ever ignored. Implies --apply`,
				Args: []model.Arg{{
					Name: "n",
				}},
			}, {
				Name:        []string{"--no-ff", "--force-rebase", "-f"},
				Description: `Individually replay all rebased commits instead of fast-forwarding over the unchanged ones. This ensures that the entire history of the rebased branch is composed of new commits. You may find this helpful after reverting a topic branch merge, as this option recreates the topic branch with fresh commits so it can be remerged successfully without needing to 'revert the reversion' (see the revert-a-faulty-merge How-To for details)`,
			}, {
				Name:        []string{"--fork-point"},
				Description: `Use reflog to find a better common ancestor between <upstream> and <branch> when calculating which commits have been introduced by <branch>. When --fork-point is active, fork_point will be used instead of <upstream> to calculate the set of commits to rebase, where fork_point is the result of git merge-base --fork-point <upstream> <branch> command (see git-merge-base[1]). If fork_point ends up being empty, the <upstream> will be used as a fallback. If <upstream> is given on the command line, then the default is --no-fork-point, otherwise the default is --fork-point. If your branch was based on <upstream> but <upstream> was rewound and your branch contains commits which were dropped, this option can be used with --keep-base in order to drop those commits from your branch`,
			}, {
				Name:        []string{"--no-fork-point"},
				Description: `Do not use reflog to find a better common ancestor between <upstream> and <branch> when calculating which commits have been introduced by <branch>. When --fork-point is active, fork_point will be used instead of <upstream> to calculate the set of commits to rebase, where fork_point is the result of git merge-base --fork-point <upstream> <branch> command (see git-merge-base[1]). If fork_point ends up being empty, the <upstream> will be used as a fallback. If <upstream> is given on the command line, then the default is --no-fork-point, otherwise the default is --fork-point. If your branch was based on <upstream> but <upstream> was rewound and your branch contains commits which were dropped, this option can be used with --keep-base in order to drop those commits from your branch`,
			}, {
				Name:        []string{"--ignore-whitespace"},
				Description: `Ignore whitespace differences when trying to reconcile differences. Currently, each backend implements an approximation of this behavior: apply backend: When applying a patch, ignore changes in whitespace in context lines. Unfortunately, this means that if the 'old' lines being replaced by the patch differ only in whitespace from the existing file, you will get a merge conflict instead of a successful patch application. merge backend: Treat lines with only whitespace changes as unchanged when merging. Unfortunately, this means that any patch hunks that were intended to modify whitespace and nothing else will be dropped, even if the other side had no changes that conflicted`,
			}, {
				Name:        []string{"--whitespace"},
				Description: `This flag is passed to the git apply program (see git-apply[1]) that applies the patch. Implies --apply`,
				Args: []model.Arg{{
					Name: "option",
				}},
			}, {
				Name:        []string{"--committer-date-is-author-date"},
				Description: `Instead of using the current time as the committer date, use the author date of the commit being rebased as the committer date. This option implies --force-rebase`,
			}, {
				Name:        []string{"--ignore-date", "--reset-author-date"},
				Description: `Instead of using the author date of the original commit, use the current time as the author date of the rebased commit. This option implies --force-rebase`,
			}, {
				Name:        []string{"--signoff"},
				Description: `Add a Signed-off-by trailer to all the rebased commits. Note that if --interactive is given then only commits marked to be picked, edited or reworded will have the trailer added`,
			}, {
				Name:        []string{"-i", "--interactive"},
				Description: `Make a list of the commits which are about to be rebased. Let the user edit that list before rebasing. This mode can also be used to split commits (see SPLITTING COMMITS below). The commit list format can be changed by setting the configuration option rebase.instructionFormat. A customized instruction format will automatically have the long commit hash prepended to the format`,
			}, {
				Name:        []string{"-r", "--rebase-merges"},
				Description: `By default, a rebase will simply drop merge commits from the todo list, and put the rebased commits into a single, linear branch. With --rebase-merges, the rebase will instead try to preserve the branching structure within the commits that are to be rebased, by recreating the merge commits. Any resolved merge conflicts or manual amendments in these merge commits will have to be resolved/re-applied manually. By default, or when no-rebase-cousins was specified, commits which do not have <upstream> as direct ancestor will keep their original branch point, i.e. commits that would be excluded by git-log[1]'s --ancestry-path option will keep their original ancestry by default. If the rebase-cousins mode is turned on, such commits are instead rebased onto <upstream> (or <onto>, if specified). The --rebase-merges mode is similar in spirit to the deprecated --preserve-merges but works with interactive rebases, where commits can be reordered, inserted and dropped at will. It is currently only possible to recreate the merge commits using the recursive merge strategy; Different merge strategies can be used only via explicit exec git merge -s <strategy> [...] commands`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`rebase-cousins`}}, {Name: []string{`no-rebase-cousins`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"-x", "--exec"},
				Description: `Append 'exec <cmd>' after each line creating a commit in the final history. <cmd> will be interpreted as one or more shell commands. Any command that fails will interrupt the rebase, with exit code 1. You may execute several commands by either using one instance of --exec with several commands: git rebase -i --exec 'cmd1 && cmd2 && ...' or by giving more than one --exec: git rebase -i --exec 'cmd1' --exec 'cmd2' --exec ... If --autosquash is used, 'exec' lines will not be appended for the intermediate commits, and will only appear at the end of each squash/fixup series. This uses the --interactive machinery internally, but it can be run without an explicit --interactive`,
				Args: []model.Arg{{
					Name: "cmd",
				}},
			}, {
				Name:        []string{"--root"},
				Description: `Rebase all commits reachable from <branch>, instead of limiting them with an <upstream>. This allows you to rebase the root commit(s) on a branch. When used with --onto, it will skip changes already contained in <newbase> (instead of <upstream>) whereas without --onto it will operate on every change. When used together with both --onto and --preserve-merges, all root commits will be rewritten to have <newbase> as parent instead`,
			}, {
				Name:        []string{"--autosquash"},
				Description: `When the commit log message begins with 'squash! …​' (or 'fixup! …​'), and there is already a commit in the todo list that matches the same ..., automatically modify the todo list of rebase -i so that the commit marked for squashing comes right after the commit to be modified, and change the action of the moved commit from pick to squash (or fixup). A commit matches the ... if the commit subject matches, or if the ... refers to the commit’s hash. As a fall-back, partial matches of the commit subject work, too. The recommended way to create fixup/squash commits is by using the --fixup/--squash options of git-commit[1]`,
			}, {
				Name:        []string{"--no-autosquash"},
				Description: `When the commit log message begins with 'squash! …' (or 'fixup! …'), and there is already a commit in the todo list that matches the same ..., automatically modify the todo list of rebase -i so that the commit marked for squashing comes right after the commit to be modified, and change the action of the moved commit from pick to squash (or fixup). A commit matches the ... if the commit subject matches, or if the ... refers to the commit’s hash. As a fall-back, partial matches of the commit subject work, too. The recommended way to create fixup/squash commits is by using the --fixup/--squash options of git-commit[1]`,
			}, {
				Name:        []string{"--autostash"},
				Description: `Automatically create a temporary stash entry before the operation begins, and apply it after the operation ends. This means that you can run rebase on a dirty worktree. However, use with care: the final stash application after a successful rebase might result in non-trivial conflicts`,
			}, {
				Name:        []string{"--no-autostash"},
				Description: `Do not automatically create a temporary stash entry before the operation begins, and apply it after the operation ends. This means that you can run rebase on a dirty worktree. However, use with care: the final stash application after a successful rebase might result in non-trivial conflicts`,
			}, {
				Name:        []string{"--reschedule-failed-exec"},
				Description: `Automatically reschedule exec commands that failed. This only makes sense in interactive mode (or when an --exec option was provided)`,
			}, {
				Name:        []string{"--no-reschedule-failed-exec"},
				Description: `Do not automatically reschedule exec commands that failed. This only makes sense in interactive mode (or when an --exec option was provided)`,
			}},
		}, {
			Name:        []string{"add"},
			Description: `Add file contents to the index`,
			Args: []model.Arg{{
				Name:       "pathspec",
				Generator:  git.AddFileGenerator(),
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-n", "--dry-run"},
				Description: `Don’t actually add the file(s), just show if they exist and/or will be ignored`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `Allow adding otherwise ignored files`,
			}, {
				Name:        []string{"-i", "--interactive"},
				Description: `Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset of the working tree. See “Interactive mode” for details`,
			}, {
				Name:        []string{"-p", "--patch"},
				Description: `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the difference before adding modified contents to the index`,
			}, {
				Name:        []string{"-e", "--edit"},
				Description: `Open the diff vs. the index in an editor and let the user edit it. After the editor was closed, adjust the hunk headers and apply the patch to the index`,
			}, {
				Name:        []string{"-u", "--update"},
				Description: `Update the index just where it already has an entry matching <pathspec>. This removes as well as modifies index entries to match the working tree, but adds no new files`,
			}, {
				Name:        []string{"-A", "--all", "--no-ignore-removal"},
				Description: `Update the index not only where the working tree has a file matching <pathspec> but also where the index already has an entry. This adds, modifies, and removes index entries to match the working tree`,
			}, {
				Name:        []string{"--no-all", "--ignore-removal"},
				Description: `Update the index by adding new files that are unknown to the index and files modified in the working tree, but ignore files that have been removed from the working tree. This option is a no-op when no <pathspec> is used`,
			}, {
				Name:        []string{"-N", "--intent-to-add"},
				Description: `Record only the fact that the path will be added later. An entry for the path is placed in the index with no content. This is useful for, among other things, showing the unstaged content of such files with git diff and committing them with git commit -a`,
			}, {
				Name:        []string{"--refresh"},
				Description: `Don’t add the file(s), but only refresh their stat() information in the index`,
			}, {
				Name:        []string{"--ignore-errors"},
				Description: `If some files could not be added because of errors indexing them, do not abort the operation, but continue adding the others. The command shall still exit with non-zero status. The configuration variable add.ignoreErrors can be set to true to make this the default behaviour`,
			}, {
				Name:        []string{"--ignore-missing"},
				Description: `This option can only be used together with --dry-run. By using this option the user can check if any of the given files would be ignored, no matter if they are already present in the work tree or not`,
			}, {
				Name:        []string{"--no-warn-embedded-repo"},
				Description: `By default, git add will warn when adding an embedded repository to the index without using git submodule add to create an entry in .gitmodules. This option will suppress the warning (e.g., if you are manually performing operations on submodules)`,
			}, {
				Name:        []string{"--renormalize"},
				Description: `Apply the 'clean' process freshly to all tracked files to forcibly add them again to the index. This is useful after changing core.autocrlf configuration or the text attribute in order to correct files added with wrong CRLF/LF line endings. This option implies -u`,
			}, {
				Name:        []string{"--chmod"},
				Description: `Override the executable bit of the added files. The executable bit is only changed in the index, the files on disk are left unchanged`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{Name: []string{`+x`}}, {Name: []string{`-x`}}},
				}},
			}, {
				Name:        []string{"--pathspec-from-file"},
				Description: `Pathspec is passed in <file> instead of commandline args. If <file> is exactly - then standard input is used. Pathspec elements are separated by LF or CR/LF. Pathspec elements can be quoted as explained for the configuration variable core.quotePath (see git-config[1]). See also --pathspec-file-nul and global --literal-pathspecs`,
				Args: []model.Arg{{
					Templates:   []model.Template{model.TemplateFilepaths},
					Name:        "File",
					Description: `File with pathspec`,
				}},
			}, {
				Name:        []string{"--pathspec-file-nul"},
				Description: `Only meaningful with --pathspec-from-file. Pathspec elements are separated with NUL character and all other characters are taken literally (including newlines and quotes)`,
			}, {
				Name:        []string{"--"},
				Description: `This option can be used to separate command-line options from the list of files`,
			}},
		}, {
			Name:        []string{"stage"},
			Description: `Add file contents to the staging area`,
			Args: []model.Arg{{
				Name:       "pathspec",
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-n", "--dry-run"},
				Description: `Don’t actually add the file(s), just show if they exist and/or will be ignored`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `Allow adding otherwise ignored files`,
			}, {
				Name:        []string{"-i", "--interactive"},
				Description: `Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset of the working tree. See “Interactive mode” for details`,
			}, {
				Name:        []string{"-p", "--patch"},
				Description: `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the difference before adding modified contents to the index`,
			}, {
				Name:        []string{"-e", "--edit"},
				Description: `Open the diff vs. the index in an editor and let the user edit it. After the editor was closed, adjust the hunk headers and apply the patch to the index`,
			}, {
				Name:        []string{"-u", "--update"},
				Description: `Update the index just where it already has an entry matching <pathspec>. This removes as well as modifies index entries to match the working tree, but adds no new files`,
			}, {
				Name:        []string{"-A", "--all", "--no-ignore-removal"},
				Description: `Update the index not only where the working tree has a file matching <pathspec> but also where the index already has an entry. This adds, modifies, and removes index entries to match the working tree`,
			}, {
				Name:        []string{"--no-all", "--ignore-removal"},
				Description: `Update the index by adding new files that are unknown to the index and files modified in the working tree, but ignore files that have been removed from the working tree. This option is a no-op when no <pathspec> is used`,
			}, {
				Name:        []string{"-N", "--intent-to-add"},
				Description: `Record only the fact that the path will be added later. An entry for the path is placed in the index with no content. This is useful for, among other things, showing the unstaged content of such files with git diff and committing them with git commit -a`,
			}, {
				Name:        []string{"--refresh"},
				Description: `Don’t add the file(s), but only refresh their stat() information in the index`,
			}, {
				Name:        []string{"--ignore-errors"},
				Description: `If some files could not be added because of errors indexing them, do not abort the operation, but continue adding the others. The command shall still exit with non-zero status. The configuration variable add.ignoreErrors can be set to true to make this the default behaviour`,
			}, {
				Name:        []string{"--ignore-missing"},
				Description: `This option can only be used together with --dry-run. By using this option the user can check if any of the given files would be ignored, no matter if they are already present in the work tree or not`,
			}, {
				Name:        []string{"--no-warn-embedded-repo"},
				Description: `By default, git add will warn when adding an embedded repository to the index without using git submodule add to create an entry in .gitmodules. This option will suppress the warning (e.g., if you are manually performing operations on submodules)`,
			}, {
				Name:        []string{"--renormalize"},
				Description: `Apply the 'clean' process freshly to all tracked files to forcibly add them again to the index. This is useful after changing core.autocrlf configuration or the text attribute in order to correct files added with wrong CRLF/LF line endings. This option implies -u`,
			}, {
				Name:        []string{"--chmod"},
				Description: `Override the executable bit of the added files. The executable bit is only changed in the index, the files on disk are left unchanged`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{Name: []string{`+x`}}, {Name: []string{`-x`}}},
				}},
			}, {
				Name:        []string{"--pathspec-from-file"},
				Description: `Pathspec is passed in <file> instead of commandline args. If <file> is exactly - then standard input is used. Pathspec elements are separated by LF or CR/LF. Pathspec elements can be quoted as explained for the configuration variable core.quotePath (see git-config[1]). See also --pathspec-file-nul and global --literal-pathspecs`,
				Args: []model.Arg{{
					Templates:   []model.Template{model.TemplateFilepaths},
					Name:        "File",
					Description: `File with pathspec`,
				}},
			}, {
				Name:        []string{"--pathspec-file-nul"},
				Description: `Only meaningful with --pathspec-from-file. Pathspec elements are separated with NUL character and all other characters are taken literally (including newlines and quotes)`,
			}, {
				Name:        []string{"--"},
				Description: `This option can be used to separate command-line options from the list of files`,
			}},
		}, {
			Name:        []string{"status"},
			Description: `Show the working tree status`,
			Args: []model.Arg{{
				Name:       "pathspec",
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-s", "--short"},
				Description: `Give the output in the short-format`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"-b", "--branch"},
				Description: `Show branch information`,
			}, {
				Name:        []string{"--show-stash"},
				Description: `Show stash information`,
			}, {
				Name:        []string{"--porcelain"},
				Description: `Give the output in the short-format`,
				Args: []model.Arg{{
					Name:       "version",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--ahead-behind"},
				Description: `Display full ahead/behind values`,
			}, {
				Name:        []string{"--no-ahead-behind"},
				Description: `Do not display full ahead/behind values`,
			}, {
				Name:        []string{"--column"},
				Description: `Display full ahead/behind values`,
				Args: []model.Arg{{
					Name:        "options",
					Description: `Defaults to always`,
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"--no-column"},
				Description: `Do not display untracked files in columns`,
				Args: []model.Arg{{
					Name:        "options",
					Description: `Defaults to never`,
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"--long"},
				Description: `Show status in long format (default)`,
			}, {
				Name:        []string{"-z", "--null"},
				Description: `Terminate entries with NUL`,
			}, {
				Name:        []string{"-u", "--untracked-files"},
				Description: `Show untracked files`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{
						Name:        []string{`all`},
						Description: `(Default)`,
					}, {
						Name: []string{`normal`},
					}, {
						Name: []string{`no`},
					}},
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--ignore-submodules"},
				Description: `Ignore changes to submodules when looking for changes`,
				Args: []model.Arg{{
					Name: "when",
					Suggestions: []model.Suggestion{{
						Name:        []string{`all`},
						Description: `(Default)`,
					}, {
						Name: []string{`dirty`},
					}, {
						Name: []string{`untracked`},
					}, {
						Name: []string{`none`},
					}},
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--ignored"},
				Description: `Show ignored files`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{
						Name:        []string{`traditional`},
						Description: `(Default)`,
					}, {
						Name: []string{`matching`},
					}, {
						Name: []string{`no`},
					}},
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-renames"},
				Description: `Do not detect renames`,
			}, {
				Name:        []string{"--renames"},
				Description: `Turn on rename detection regardless of user configuration`,
			}, {
				Name:        []string{"--find-renames"},
				Description: `Turn on rename detection, optionally setting the similarity threshold`,
				Args: []model.Arg{{
					Name:       "n",
					IsOptional: true,
				}},
			}},
		}, {
			Name:        []string{"clean"},
			Description: `Shows which files would be removed from working directory`,
			Args: []model.Arg{{
				Templates: []model.Template{model.TemplateFilepaths},
				Name:      "path",
			}},
			Options: []model.Option{{
				Name:        []string{"-d"},
				Description: `Normally, when no <path> is specified, git clean will not recurse into untracked directories to avoid removing too much. Specify -d to have it recurse into such directories as well. If any paths are specified, -d is irrelevant; all untracked files matching the specified paths (with exceptions for nested git directories mentioned under --force) will be removed`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `If the Git configuration variable clean.requireForce is not set to false, git clean will refuse to delete files or directories unless given -f or -i`,
			}, {
				Name:        []string{"-i", "--interactive"},
				Description: `Show what would be done and clean files interactively`,
			}, {
				Name:        []string{"-n", "--dry-run"},
				Description: `Don’t actually remove anything, just show what would be done`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Be quiet, only report errors, but not the files that are successfully removed`,
			}, {
				Name:        []string{"-e", "--exclude"},
				Description: `Use the given exclude pattern in addition to the standard ignore rules`,
				Args: []model.Arg{{
					Name: "pattern",
				}},
			}, {
				Name:        []string{"-x"},
				Description: `Don’t use the standard ignore rules (see gitignore(5)), but still use the ignore rules given with -e options from the command line. This allows removing all untracked files, including build products. This can be used (possibly in conjunction with git restore or git reset) to create a pristine working directory to test a clean build`,
			}, {
				Name:        []string{"-X"},
				Description: `Remove only files ignored by Git. This may be useful to rebuild everything from scratch, but keep manually created files`,
			}},
		}, {
			Name:        []string{"revert"},
			Description: `Create new commit that undoes all of the changes made in <commit>, then apply it to the current branch`,
			Args: []model.Arg{{
				Name:       "commit",
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
			}},
		}, {
			Name:        []string{"ls-remote"},
			Description: `List references in a remote repository`,
		}, {
			Name:        []string{"push"},
			Description: `Update remote refs`,
			Args: []model.Arg{{
				Name:           "remote",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}, {
				Name:           "branch",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}},
			Options: []model.Option{{
				Name:        []string{"--all"},
				Description: `Push all branches (i.e. refs under refs/heads/); cannot be used with other <refspec>`,
			}, {
				Name:        []string{"--prune"},
				Description: `Remove remote branches that don't have a local counterpart`,
			}, {
				Name:        []string{"--mirror"},
				Description: `Instead of naming each ref to push, specifies that all refs under refs/ be mirrored to the remote repository`,
			}, {
				Name:        []string{"-n", "--dry-run"},
				Description: `Do everything except actually send the updates`,
			}, {
				Name:        []string{"--porcelain"},
				Description: `Produce machine-readable output. The output status line for each ref will be tab-separated and sent to stdout instead of stderr`,
			}, {
				Name:        []string{"-d", "--delete"},
				Description: `All listed refs are deleted from the remote repository. This is the same as prefixing all refs with a colon`,
			}, {
				Name:        []string{"--tags"},
				Description: `All refs under refs/tags are pushed, in addition to refspecs explicitly listed on the command line`,
			}, {
				Name:        []string{"--follow-tags"},
				Description: `Push all the refs that would be pushed without this option, and also push annotated tags in refs/tags that are missing from the remote but are pointing at commit-ish that are reachable from the refs being pushed. This can also be specified with configuration variable push.followTags`,
			}, {
				Name:        []string{"--signed"},
				Description: `GPG-sign the push request to update refs on the receiving side, to allow it to be checked by the hooks and/or be logged. If false or --no-signed, no signing will be attempted. If true or --signed, the push will fail if the server does not support signed pushes. If set to if-asked, sign if and only if the server supports signed pushes. The push will also fail if the actual call to gpg --sign fails. See git-receive-pack(1) for the details on the receiving end`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{Name: []string{`true`}}, {Name: []string{`false`}}, {Name: []string{`if-asked`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"--no-signed"},
				Description: `GPG-sign the push request to update refs on the receiving side, to allow it to be checked by the hooks and/or be logged. If false or --no-signed, no signing will be attempted. If true or --signed, the push will fail if the server does not support signed pushes. If set to if-asked, sign if and only if the server supports signed pushes. The push will also fail if the actual call to gpg --sign fails. See git-receive-pack(1) for the details on the receiving end`,
			}, {
				Name:        []string{"--atomic"},
				Description: `Use an atomic transaction on the remote side if available. Either all refs are updated, or on error, no refs are updated. If the server does not support atomic pushes the push will fail`,
			}, {
				Name:        []string{"--no-atomic"},
				Description: `Use an atomic transaction on the remote side if available. Either all refs are updated, or on error, no refs are updated. If the server does not support atomic pushes the push will fail`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `Usually, the command refuses to update a remote ref that is not an ancestor of the local ref used to overwrite it. Also, when --force-with-lease option is used, the command refuses to update a remote ref whose current value does not match what is expected. This flag disables these checks, and can cause the remote repository to lose commits; use it with care`,
			}, {
				Name:        []string{"--repo"},
				Description: `This option is equivalent to the <repository> argument. If both are specified, the command-line argument takes precedence`,
				Args: []model.Arg{{
					Name: "repository",
				}},
			}, {
				Name:        []string{"-u", "--set-upstream"},
				Description: `For every branch that is up to date or successfully pushed, add upstream (tracking) reference, used by argument-less git-pull(1) and other commands`,
			}, {
				Name:        []string{"--thin"},
				Description: `These options are passed to git-send-pack(1). A thin transfer significantly reduces the amount of sent data when the sender and receiver share many of the same objects in common. The default is --thin`,
			}, {
				Name:        []string{"--no-thin"},
				Description: `These options are passed to git-send-pack(1). A thin transfer significantly reduces the amount of sent data when the sender and receiver share many of the same objects in common. The default is --thin`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Suppress all output, including the listing of updated refs, unless an error occurs. Progress is not reported to the standard error stream`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Run verbosely`,
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal, unless -q is specified. This flag forces progress status even if the standard error stream is not directed to a terminal`,
			}, {
				Name:        []string{"--no-recurse-submodules"},
				Description: `May be used to make sure all submodule commits used by the revisions to be pushed are available on a remote-tracking branch. If check is used Git will verify that all submodule commits that changed in the revisions to be pushed are available on at least one remote of the submodule. If any commits are missing the push will be aborted and exit with non-zero status. If on-demand is used all submodules that changed in the revisions to be pushed will be pushed. If on-demand was not able to push all necessary revisions it will also be aborted and exit with non-zero status. If only is used all submodules will be recursively pushed while the superproject is left unpushed. A value of no or using --no-recurse-submodules can be used to override the push.recurseSubmodules configuration variable when no submodule recursion is required`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `May be used to make sure all submodule commits used by the revisions to be pushed are available on a remote-tracking branch. If check is used Git will verify that all submodule commits that changed in the revisions to be pushed are available on at least one remote of the submodule. If any commits are missing the push will be aborted and exit with non-zero status. If on-demand is used all submodules that changed in the revisions to be pushed will be pushed. If on-demand was not able to push all necessary revisions it will also be aborted and exit with non-zero status. If only is used all submodules will be recursively pushed while the superproject is left unpushed. A value of no or using --no-recurse-submodules can be used to override the push.recurseSubmodules configuration variable when no submodule recursion is required`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{Name: []string{`check`}}, {Name: []string{`on-demand`}}, {Name: []string{`only`}}, {Name: []string{`no`}}},
				}},
			}, {
				Name:        []string{"--verify"},
				Description: `Turn on the pre-push hook. The default is --verify, giving the hook a chance to prevent the push. With`,
			}, {
				Name:        []string{"--no-verify"},
				Description: `Turn off the pre-push hook. The default is --verify, giving the hook a chance to prevent the push. With`,
			}, {
				Name:        []string{"-4", "--ipv4"},
				Description: `Use IPv4 addresses only, ignoring IPv6 addresses`,
			}, {
				Name:        []string{"-6", "--ipv6"},
				Description: `Use IPv6 addresses only, ignoring IPv4 addresses`,
			}, {
				Name:        []string{"-o", "--push-option"},
				Description: `Transmit the given string to the server, which passes them to the pre-receive as well as the post-receive hook. The given string must not contain a NUL or LF character. When multiple --push-option=<option> are given, they are all sent to the other side in the order listed on the command line. When no --push-option=<option> is given from the command line, the values of configuration variable push.pushOption are used instead`,
				Args: []model.Arg{{
					Name: "option",
				}},
			}, {
				Name:        []string{"--receive-pack", "--exec"},
				Description: `Path to the git-receive-pack program on the remote end. Sometimes useful when pushing to a remote repository over ssh, and you do not have the program in a directory on the default $PATH`,
				Args: []model.Arg{{
					Name: "git-receive-pack",
				}},
			}, {
				Name:        []string{"--no-force-with-lease"},
				Description: `Cancel all the previous --force-with-lease on the command line`,
			}, {
				Name:        []string{"--force-with-lease"},
				Description: `Protect the named ref (alone), if it is going to be updated, by requiring its current value to be the same as the specified value <expect> (which is allowed to be different from the remote-tracking branch we have for the refname, or we do not even have to have such a remote-tracking branch when this form is used). If <expect> is the empty string, then the named ref must not already exist`,
				Args: []model.Arg{{
					Name:       "refname[:expect]",
					IsOptional: true,
				}},
			}},
		}, {
			Name:        []string{"pull"},
			Description: `Integrate with another repository`,
			Args: []model.Arg{{
				Name:           "remote",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}, {
				Name:           "branch",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}},
			Options: []model.Option{{
				Name:        []string{"--rebase", "-r"},
				Description: `Fetch the remote’s copy of current branch and rebases it into the local copy`,
				Args: []model.Arg{{
					Name:           "remote",
					Suggestions:    []model.Suggestion{{Name: []string{`false`}}, {Name: []string{`true`}}, {Name: []string{`merges`}}, {Name: []string{`preserve`}}, {Name: []string{`interactive`}}},
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
			}, {
				Name:        []string{"--no-rebase"},
				Description: `Override earlier --rebase`,
			}, {
				Name:        []string{"--commit"},
				Description: `Perform the merge and commit the result. This option can be used to override --no-commit`,
			}, {
				Name:        []string{"--no-commit"},
				Description: `Perform the merge and stop just before creating a merge commit, to give the user a chance to inspect and further tweak the merge result before committing`,
			}, {
				Name:        []string{"--edit", "-e"},
				Description: `Invoke an editor before committing successful mechanical merge to further edit the auto-generated merge message, so that the user can explain and justify the merge`,
			}, {
				Name:        []string{"--no-edit"},
				Description: `The --no-edit option can be used to accept the auto-generated message (this is generally discouraged). The --edit (or -e) option is still useful if you are giving a draft message with the -m option from the command line and want to edit it in the editor`,
			}, {
				Name:        []string{"--cleanup"},
				Description: `This option determines how the merge message will be cleaned up before committing. See git-commit[1] for more details. In addition, if the <mode> is given a value of scissors, scissors will be appended to MERGE_MSG before being passed on to the commit machinery in the case of a merge conflict`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`strip`}}, {Name: []string{`whitespace`}}, {Name: []string{`verbatim`}}, {Name: []string{`scissors`}}, {Name: []string{`default`}}},
				}},
			}, {
				Name:        []string{"--ff"},
				Description: `When possible resolve the merge as a fast-forward (only update the branch pointer to match the merged branch; do not create a merge commit). When not possible (when the merged-in history is not a descendant of the current history), create a merge commit`,
			}, {
				Name:        []string{"--no-ff"},
				Description: `Create a merge commit in all cases, even when the merge could instead be resolved as a fast-forward`,
			}, {
				Name:        []string{"--ff-only"},
				Description: `Resolve the merge as a fast-forward when possible. When not possible, refuse to merge and exit with a non-zero status`,
			}, {
				Name:        []string{"-S", "--gpg-sign"},
				Description: `GPG-sign the resulting merge commit. The keyid argument is optional and defaults to the committer identity; if specified, it must be stuck to the option without a space`,
				Args: []model.Arg{{
					Name:       "keyid",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-gpg-sign"},
				Description: `Is useful to countermand both commit.gpgSign configuration variable, and earlier --gpg-sign`,
			}, {
				Name:        []string{"--log"},
				Description: `In addition to branch names, populate the log message with one-line descriptions from at most <n> actual commits that are being merged. See also git-fmt-merge-msg[1]`,
				Args: []model.Arg{{
					Name:       "n",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-log"},
				Description: `Do not list one-line descriptions from the actual commits being merged`,
			}, {
				Name:        []string{"--signoff"},
				Description: `Add a Signed-off-by trailer by the committer at the end of the commit log message. The meaning of a signoff depends on the project to which you’re committing. For example, it may certify that the committer has the rights to submit the work under the project’s license or agrees to some contributor representation, such as a Developer Certificate of Origin. (See http://developercertificate.org for the one used by the Linux kernel and Git projects.) Consult the documentation or leadership of the project to which you’re contributing to understand how the signoffs are used in that project`,
			}, {
				Name:        []string{"--no-signoff"},
				Description: `Can be used to countermand an earlier --signoff option on the command line`,
			}, {
				Name:        []string{"--stat"},
				Description: `Show a diffstat at the end of the merge. The diffstat is also controlled by the configuration option merge.stat`,
			}, {
				Name:        []string{"-n", "--no-stat"},
				Description: `Do not show a diffstat at the end of the merge`,
			}, {
				Name:        []string{"--squash"},
				Description: `With --squash, --commit is not allowed, and will fail. Produce the working tree and index state as if a real merge happened (except for the merge information), but do not actually make a commit, move the HEAD, or record $GIT_DIR/MERGE_HEAD (to cause the next git commit command to create a merge commit). This allows you to create a single commit on top of the current branch whose effect is the same as merging another branch (or more in case of an octopus)`,
			}, {
				Name:        []string{"--no-squash"},
				Description: `Perform the merge and commit the result. This option can be used to override --squash`,
			}, {
				Name:        []string{"--no-verify"},
				Description: `This option bypasses the pre-merge and commit-msg hooks. See also githooks[5]`,
			}, {
				Name:        []string{"-s", "--strategy"},
				Description: `Use the given merge strategy; can be supplied more than once to specify them in the order they should be tried. If there is no -s option, a built-in list of strategies is used instead (git merge-recursive when merging a single head, git merge-octopus otherwise)`,
				Args: []model.Arg{{
					Name:        "strategy",
					Suggestions: []model.Suggestion{{Name: []string{`resolve`}}, {Name: []string{`recursive`}}, {Name: []string{`octopus`}}, {Name: []string{`ours`}}, {Name: []string{`subtree`}}},
					IsVariadic:  true,
				}},
			}, {
				Name:        []string{"-X", "--strategy-option"},
				Description: `Pass merge strategy specific option through to the merge strategy`,
				Args: []model.Arg{{
					Name:        "option",
					Suggestions: []model.Suggestion{{Name: []string{`ours`}}, {Name: []string{`theirs`}}, {Name: []string{`patience`}}, {Name: []string{`diff-algorithm`}}, {Name: []string{`diff-algorithm=patience`}}, {Name: []string{`diff-algorithm=minimal`}}, {Name: []string{`diff-algorithm=histogram`}}, {Name: []string{`diff-algorithm=myers`}}, {Name: []string{`ignore-space-change`}}, {Name: []string{`ignore-all-space`}}, {Name: []string{`ignore-space-at-eol`}}, {Name: []string{`ignore-cr-at-eol`}}, {Name: []string{`renormalize`}}, {Name: []string{`no-renormalize`}}, {Name: []string{`no-renames`}}, {Name: []string{`find-renames`}}, {Name: []string{`subtree`}}},
				}},
			}, {
				Name:        []string{"--verify-signatures"},
				Description: `Verify that the tip commit of the side branch being merged is signed with a valid key, i.e. a key that has a valid uid: in the default trust model, this means the signing key has been signed by a trusted key. If the tip commit of the side branch is not signed with a valid key, the merge is aborted`,
			}, {
				Name:        []string{"--no-verify-signatures"},
				Description: `Do not verify that the tip commit of the side branch being merged is signed with a valid key`,
			}, {
				Name:        []string{"--summary"},
				Description: `Synonym to --stat ; this is deprecated and will be removed in the future`,
			}, {
				Name:        []string{"--no-summary"},
				Description: `Synonym to --no-stat ; this is deprecated and will be removed in the future`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Operate quietly. Implies --no-progress`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"--autostash"},
				Description: `Automatically create a temporary stash entry before the operation begins, and apply it after the operation ends. This means that you can run the operation on a dirty worktree. However, use with care: the final stash application after a successful merge might result in non-trivial conflicts`,
			}, {
				Name:        []string{"--no-autostash"},
				Description: `Do not automatically create a temporary stash entry before the operation begins, and apply it after the operation ends`,
			}, {
				Name:        []string{"--allow-unrelated-histories"},
				Description: `By default, git merge command refuses to merge histories that do not share a common ancestor. This option can be used to override this safety when merging histories of two projects that started their lives independently. As that is a very rare occasion, no configuration variable to enable this by default exists and will not be added`,
			}, {
				Name:        []string{"--all"},
				Description: `Fetch all remotes`,
			}, {
				Name:        []string{"-a", "--append"},
				Description: `Append ref names and object names of fetched refs to the existing contents of .git/FETCH_HEAD`,
			}, {
				Name:        []string{"--atomic"},
				Description: `Use an atomic transaction to update local refs. Either all refs are updated, or on error, no refs are updated`,
			}, {
				Name:        []string{"--depth"},
				Description: `Limit fetching to the specified number of commits from the tip of each remote branch history`,
				Args: []model.Arg{{
					Name: "depth",
				}},
			}, {
				Name:        []string{"--deepen"},
				Description: `Similar to --depth, except it specifies the number of commits from the current shallow boundary instead of from the tip of each remote branch history`,
				Args: []model.Arg{{
					Name: "depth",
				}},
			}, {
				Name:        []string{"--shallow-since"},
				Description: `Deepen or shorten the history of a shallow repository to include all reachable commits after <date>`,
				Args: []model.Arg{{
					Name: "date",
				}},
			}, {
				Name:        []string{"--shallow-exclude"},
				Description: `Deepen or shorten the history of a shallow repository to exclude commits reachable from a specified remote branch or tag. This option can be specified multiple times`,
				Args: []model.Arg{{
					Name: "revision",
				}},
			}, {
				Name:        []string{"--unshallow"},
				Description: `If the source repository is shallow, fetch as much as possible so that the current repository has the same history as the source repository`,
			}, {
				Name:        []string{"--update-shallow"},
				Description: `By default when fetching from a shallow repository, git fetch refuses refs that require updating .git/shallow`,
			}, {
				Name:        []string{"--negotiation-tip"},
				Description: `By default, Git will report, to the server, commits reachable from all local refs to find common commits in an attempt to reduce the size of the to-be-received packfile`,
				Args: []model.Arg{{
					Name:      "commit|glob",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--dry-run"},
				Description: `Show what would be done, without making any changes`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `This option overrides that check`,
			}, {
				Name:        []string{"-k", "--keep"},
				Description: `Keep downloaded pack`,
			}, {
				Name:        []string{"-p", "--prune"},
				Description: `Before fetching, remove any remote-tracking references that no longer exist on the remote`,
			}, {
				Name:        []string{"-P", "--prune-tags"},
				Description: `Before fetching, remove any local tags that no longer exist on the remote if --prune is enabled`,
			}, {
				Name:        []string{"--no-tags"},
				Description: `By default, tags that point at objects that are downloaded from the remote repository are fetched and stored locally. This option disables this automatic tag following`,
			}, {
				Name:        []string{"--refmap"},
				Description: `When fetching refs listed on the command line, use the specified refspec (can be given more than once) to map the refs to remote-tracking branches, instead of the values of remote.*.fetch configuration variables for the remote repository`,
				Args: []model.Arg{{
					Name: "refspec",
				}},
			}, {
				Name:        []string{"-t", "--tags"},
				Description: `By default, tags that point at objects that are downloaded from the remote repository are fetched and stored locally. This option disables this automatic tag following`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `When fetching refs listed on the command line, use the specified refspec (can be given more than once) to map the refs to remote-tracking branches, instead of the values of remote.*.fetch configuration variables for the remote repository`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`yes`}}, {Name: []string{`on-demand`}}, {Name: []string{`no`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"--no-recurse-submodules"},
				Description: `Disable recursive fetching of submodules (this has the same effect as using the --recurse-submodules=no option)`,
			}, {
				Name:        []string{"-j", "--jobs"},
				Description: `Number of parallel children to be used for all forms of fetching`,
				Args: []model.Arg{{
					Name: "n",
				}},
			}, {
				Name:        []string{"--set-upstream"},
				Description: `If the remote is fetched successfully, add upstream (tracking) reference, used by argument-less git-pull[1] and other commands`,
			}, {
				Name:        []string{"--upload-pack"},
				Description: `When given, and the repository to fetch from is handled by git fetch-pack, --exec=<upload-pack> is passed to the command to specify non-default path for the command run on the other end`,
				Args: []model.Arg{{
					Name: "upload-pack",
				}},
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal, unless -q is specified`,
			}, {
				Name:        []string{"-o", "--server-option"},
				Description: `Transmit the given string to the server when communicating using protocol version 2. The given string must not contain a NUL or LF character`,
				Args: []model.Arg{{
					Name: "option",
				}},
			}, {
				Name:        []string{"--show-forced-updates"},
				Description: `By default, git checks if a branch is force-updated during fetch. This can be disabled through fetch.showForcedUpdates, but the --show-forced-updates option guarantees this check occurs`,
			}, {
				Name:        []string{"--no-show-forced-updates"},
				Description: `By default, git checks if a branch is force-updated during fetch. Pass --no-show-forced-updates or set fetch.showForcedUpdates to false to skip this check for performance reasons`,
			}, {
				Name:        []string{"-4", "--ipv4"},
				Description: `Use IPv4 addresses only, ignoring IPv6 addresses`,
			}, {
				Name:        []string{"-6", "--ipv6"},
				Description: `Use IPv6 addresses only, ignoring IPv4 addresses`,
			}},
		}, {
			Name:        []string{"diff"},
			Description: `Show changes between commits, commit and working tree, etc`,
			Args: []model.Arg{{
				Name: "commit or file",
				Suggestions: []model.Suggestion{{
					Name:        []string{`HEAD`},
					Description: `The most recent commit`,
				}, {
					Name:        []string{`HEAD~<N>`},
					Description: `A specific number of commits`,
				}},
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--staged"},
				Description: `Show difference between the files in the staging area and the latest version`,
			}, {
				Name:        []string{"--cached"},
				Description: `Show difference between staged changes and last commit`,
			}, {
				Name:        []string{"--help"},
				Description: `Shows different options`,
			}, {
				Name:        []string{"--numstat"},
				Description: `Shows number of added and deleted lines in decimal notation`,
			}, {
				Name:        []string{"--shortstat"},
				Description: `Output only the last line of the --stat format containing total number of modified files`,
			}, {
				Name:        []string{"--stat"},
				Description: `Generate a diffstat`,
				Args: []model.Arg{{
					Name:       "[=< width >[,< name-width >[,< count >]]]",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--"},
				Description: `Separates paths from options for disambiguation purposes`,
				Args: []model.Arg{{
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "[< path >...]",
					IsVariadic: true,
				}},
			}},
		}, {
			Name:        []string{"reset"},
			Description: `Reset current HEAD to the specified state`,
			Args: []model.Arg{{
				Suggestions: []model.Suggestion{{
					Name:        []string{`HEAD`},
					Description: `The most recent commit`,
				}, {
					Name:        []string{`HEAD~<N>`},
					Description: `A specific number of commits`,
				}},
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--keep"},
				Description: `Safe: files which are different between the current HEAD and the given commit. Will abort if there are uncommitted changes`,
			}, {
				Name:        []string{"--soft"},
				Description: `Remove the last commit from the current branch, but the file changes will stay in your working tree`,
			}, {
				Name:        []string{"--hard"},
				Description: `⚠️WARNING: you will lose all uncommitted changes in addition to the changes introduced in the last commit`,
			}, {
				Name:        []string{"--mixed"},
				Description: `Keep the changes in your working tree but not on the index`,
			}, {
				Name:        []string{"-N"},
				Description: `Mark removed paths as intent-to-add`,
			}, {
				Name:        []string{"--merge"},
				Description: `Resets the index and updates the files in the working tree that are different between 'commit' and HEAD`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Be quiet, only report errors`,
				ExclusiveOn: []string{"--no-quiet"},
			}, {
				Name:        []string{"--no-quiet"},
				Description: `Inverse of --quiet`,
				ExclusiveOn: []string{"-q", "--quiet"},
			}, {
				Name:        []string{"--pathspec-from-file"},
				Description: `Pathspec is passed in file <file> instead of commandline args`,
				Args: []model.Arg{{
					Templates:   []model.Template{model.TemplateFolders, model.TemplateFilepaths},
					Name:        "file",
					Suggestions: []model.Suggestion{{Name: []string{`-`}}},
				}},
			}, {
				Name:        []string{"--pathspec-file-nul"},
				Description: `Pathspec elements are separated with NUL character`,
			}, {
				Name:        []string{"-p", "--patch"},
				Description: `Interactively select hunks in the difference between the index and <tree-ish>`,
			}},
		}, {
			Name:        []string{"log"},
			Description: `Show commit logs`,
			Args: []model.Arg{{
				Name:        "since",
				Description: `Commit ID, branch name, HEAD, or revision reference`,
				Suggestions: []model.Suggestion{{
					Name:        []string{`HEAD`},
					Description: `The most recent commit`,
				}, {
					Name:        []string{`HEAD~<N>`},
					Description: `A specific number of commits`,
				}},
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
			}, {
				Name:        "until",
				Description: `Commit ID, branch name, HEAD, or revision reference`,
				Suggestions: []model.Suggestion{{
					Name:        []string{`HEAD`},
					Description: `The most recent commit`,
				}, {
					Name:        []string{`HEAD~<N>`},
					Description: `A specific number of commits`,
				}},
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--follow"},
				Description: `Show history of given file`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Suppress diff output`,
			}, {
				Name:        []string{"--source"},
				Description: `Show source`,
			}, {
				Name:        []string{"--oneline"},
				Description: `Show each commit as a single line`,
			}, {
				Name:        []string{"-p", "-u", "--patch"},
				Description: `Display the full diff of each commit`,
			}, {
				Name:        []string{"--stat"},
				Description: `Include which files were altered and the relative number of lines that were added or deleted from each of them`,
			}, {
				Name:        []string{"--grep"},
				Description: `Search for commits with a commit message that matches <pattern>`,
				Args: []model.Arg{{
					Name: "pattern",
				}},
			}, {
				Name:        []string{"--author"},
				Description: `Search for commits by a particular author`,
				Args: []model.Arg{{
					Name: "pattern",
				}},
			}},
		}, {
			Name:        []string{"remote"},
			Description: `Manage remote repository`,
			Options: []model.Option{{
				Name:        []string{"-v", "--verbose"},
				Description: `Be a little more verbose and show remote url after name. NOTE: This must be placed between remote and subcommand`,
			}},
			Subcommands: []model.Subcommand{{
				Name:        []string{"add"},
				Description: `Add a remote named <name> for the repository at <url>`,
				Args: []model.Arg{{
					Name: "name",
				}, {
					Name: "repository url",
				}},
				Options: []model.Option{{
					Name:        []string{"-t"},
					Description: `A refspec to track only <branch> is created`,
					Args: []model.Arg{{
						Name: "branch",
					}},
				}, {
					Name:        []string{"-m"},
					Description: `A symbolic-ref refs/remotes/<name>/HEAD is set up to point at remote’s <master> branch`,
					Args: []model.Arg{{
						Name: "master",
					}},
				}, {
					Name:        []string{"-f"},
					Description: `Git fetch <name> is run immediately after the remote information is set up`,
				}, {
					Name:        []string{"--tags"},
					Description: `Git fetch <name> imports every tag from the remote repository`,
				}, {
					Name:        []string{"--no-tags"},
					Description: `Git fetch <name> does not import tags from the remote repository`,
				}, {
					Name:        []string{"--mirror"},
					Description: `Create fetch or push mirror`,
					Args: []model.Arg{{
						Suggestions: []model.Suggestion{{Name: []string{`fetch`}}, {Name: []string{`push`}}},
					}},
				}},
			}, {
				Name:        []string{"set-head"},
				Description: `Sets or deletes the default branch`,
				Args: []model.Arg{{
					Name: "name",
				}, {
					Name:       "branch",
					IsOptional: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--auto", "-a"},
					Description: `The remote is queried to determine its HEAD, then the symbolic-ref refs/remotes/<name>/HEAD is set to the same branch`,
				}, {
					Name:        []string{"--delete", "-d"},
					Description: `The symbolic ref refs/remotes/<name>/HEAD is deleted`,
				}},
			}, {
				Name:        []string{"set-branches"},
				Description: `Changes the list of branches tracked by the named remote. This can be used to track a subset of the available remote branches after the initial setup for a remote`,
				Args: []model.Arg{{
					Name: "name",
				}, {
					Name:       "branch",
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--add"},
					Description: `Instead of replacing the list of currently tracked branches, adds to that list`,
				}},
			}, {
				Name:        []string{"rm", "remove"},
				Description: `Removes given remote [name]`,
				Args: []model.Arg{{
					Name:           "remote",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"rename"},
				Description: `Removes given remote [name]`,
				Args: []model.Arg{{
					Name:           "old remote",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					Name: "new remote name",
				}},
			}, {
				Name:        []string{"get-url"},
				Description: `Retrieves the URLs for a remote`,
				Args: []model.Arg{{
					Name: "name",
				}},
				Options: []model.Option{{
					Name:        []string{"--push"},
					Description: `Push URLs are queried rather than fetch URLs`,
				}, {
					Name:        []string{"--all"},
					Description: `All URLs for the remote will be listed`,
				}},
			}, {
				Name:        []string{"set-url"},
				Description: `Changes the URLs for the remote`,
				Args: []model.Arg{{
					Name: "name",
				}, {
					Name: "newurl",
				}, {
					Name:       "oldurl",
					IsOptional: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--push"},
					Description: `Push URLs are manipulated instead of fetch URLs`,
				}, {
					Name:        []string{"--add"},
					Description: `Instead of changing existing URLs, new URL is added`,
				}, {
					Name:        []string{"--delete"},
					Description: `Instead of changing existing URLs, all URLs matching regex <url> are deleted for remote <name>`,
				}},
			}, {
				Name:        []string{"show"},
				Description: `Gives some information about the remote [name]`,
				Args: []model.Arg{{
					Name:       "name",
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"-n"},
					Description: `The remote heads are not queried first with git ls-remote <name>; cached information is used instead`,
				}},
			}, {
				Name:        []string{"prune"},
				Description: `Equivalent to git fetch --prune [name], except that no new references will be fetched`,
				Args: []model.Arg{{
					Name:       "name",
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name: []string{"-n"},
				}, {
					Name:        []string{"--dry-run"},
					Description: `Report what branches would be pruned, but do not actually prune them`,
				}},
			}, {
				Name:        []string{"update"},
				Description: `Fetch updates for remotes or remote groups in the repository as defined by remotes.<group>`,
				Args: []model.Arg{{
					Name:       "group",
					IsOptional: true,
					IsVariadic: true,
				}, {
					Name:       "remote",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"-p", "--prune"},
					Description: ``,
				}},
			}},
		}, {
			Name:        []string{"fetch"},
			Description: `Download objects and refs from another repository`,
			Args: []model.Arg{{
				Name:           "remote",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}, {
				Name:           "branch",
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}, {
				Name:       "refspec",
				IsOptional: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--all"},
				Description: `Fetch all remotes`,
			}, {
				Name:        []string{"-a", "--append"},
				Description: `Append ref names and object names of fetched refs to the existing contents of .git/FETCH_HEAD`,
			}, {
				Name:        []string{"--atomic"},
				Description: `Use an atomic transaction to update local refs. Either all refs are updated, or on error, no refs are updated`,
			}, {
				Name:        []string{"--depth"},
				Description: `Limit fetching to the specified number of commits from the tip of each remote branch history`,
				Args: []model.Arg{{
					Name: "depth",
				}},
			}, {
				Name:        []string{"--deepen"},
				Description: `Similar to --depth, except it specifies the number of commits from the current shallow boundary instead of from the tip of each remote branch history`,
				Args: []model.Arg{{
					Name: "depth",
				}},
			}, {
				Name:        []string{"--shallow-since"},
				Description: `Deepen or shorten the history of a shallow repository to include all reachable commits after <date>`,
				Args: []model.Arg{{
					Name: "date",
				}},
			}, {
				Name:        []string{"--shallow-exclude"},
				Description: `Deepen or shorten the history of a shallow repository to exclude commits reachable from a specified remote branch or tag. This option can be specified multiple times`,
				Args: []model.Arg{{
					Name: "revision",
				}},
			}, {
				Name:        []string{"--unshallow"},
				Description: `If the source repository is shallow, fetch as much as possible so that the current repository has the same history as the source repository`,
			}, {
				Name:        []string{"--update-shallow"},
				Description: `By default when fetching from a shallow repository, git fetch refuses refs that require updating .git/shallow`,
			}, {
				Name:        []string{"--negotiation-tip"},
				Description: `By default, Git will report, to the server, commits reachable from all local refs to find common commits in an attempt to reduce the size of the to-be-received packfile`,
				Args: []model.Arg{{
					Name:      "commit|glob",
					Generator: nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"--dry-run"},
				Description: `Show what would be done, without making any changes`,
			}, {
				Name:        []string{"--write-fetch-head"},
				Description: `Write the list of remote refs fetched in the FETCH_HEAD file directly under $GIT_DIR. This is the default`,
			}, {
				Name:        []string{"--no-write-fetch-head"},
				Description: `Tells Git not to write the file`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `This option overrides that check`,
			}, {
				Name:        []string{"-k", "--keep"},
				Description: `Keep downloaded pack`,
			}, {
				Name:        []string{"--multiple"},
				Description: `Allow several <repository> and <group> arguments to be specified. No <refspec>s may be specified`,
			}, {
				Name:        []string{"--auto-maintenance", "--auto-gc"},
				Description: `Run git maintenance run --auto at the end to perform automatic repository maintenance if`,
			}, {
				Name:        []string{"--no-auto-maintenance", "--no-auto-gc"},
				Description: `Don't run git maintenance run --auto at the end to perform automatic repository maintenance`,
			}, {
				Name:        []string{"--write-commit-graph"},
				Description: `Write a commit-graph after fetching. This overrides the config setting fetch.writeCommitGraph`,
			}, {
				Name:        []string{"--no-write-commit-graph"},
				Description: `Don't write a commit-graph after fetching. This overrides the config setting fetch.writeCommitGraph`,
			}, {
				Name:        []string{"-p", "--prune"},
				Description: `Before fetching, remove any remote-tracking references that no longer exist on the remote`,
			}, {
				Name:        []string{"-P", "--prune-tags"},
				Description: `Before fetching, remove any local tags that no longer exist on the remote if --prune is enabled`,
			}, {
				Name:        []string{"-n", "--no-tags"},
				Description: `By default, tags that point at objects that are downloaded from the remote repository are fetched and stored locally. This option disables this automatic tag following`,
			}, {
				Name:        []string{"--refmap"},
				Description: `When fetching refs listed on the command line, use the specified refspec (can be given more than once) to map the refs to remote-tracking branches, instead of the values of remote.*.fetch configuration variables for the remote repository`,
				Args: []model.Arg{{
					Name: "refspec",
				}},
			}, {
				Name:        []string{"-t", "--tags"},
				Description: `By default, tags that point at objects that are downloaded from the remote repository are fetched and stored locally. This option disables this automatic tag following`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `When fetching refs listed on the command line, use the specified refspec (can be given more than once) to map the refs to remote-tracking branches, instead of the values of remote.*.fetch configuration variables for the remote repository`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`yes`}}, {Name: []string{`on-demand`}}, {Name: []string{`no`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"-j", "--jobs"},
				Description: `Number of parallel children to be used for all forms of fetching`,
				Args: []model.Arg{{
					Name: "n",
				}},
			}, {
				Name:        []string{"--no-recurse-submodules"},
				Description: `Disable recursive fetching of submodules (this has the same effect as using the --recurse-submodules=no option)`,
			}, {
				Name:        []string{"--set-upstream"},
				Description: `If the remote is fetched successfully, add upstream (tracking) reference, used by argument-less git-pull[1] and other commands`,
			}, {
				Name:        []string{"--submodule-prefix"},
				Description: `Prepend <path> to paths printed in informative messages such as ”Fetching submodule foo". This option is used internally when recursing over submodules`,
				Args: []model.Arg{{
					Name: "path",
				}},
			}, {
				Name:        []string{"--recurse-submodules-default"},
				Description: `This option is used internally to temporarily provide a non-negative default value for the --recurse-submodules option`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`yes`}}, {Name: []string{`on-demand`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"-u", "--update-head-ok"},
				Description: `By default git fetch refuses to update the head which corresponds to the current branch. This flag disables the check. This is purely for the internal use for git pull to communicate with git fetch, and unless you are implementing your own Porcelain you are not supposed to use it`,
			}, {
				Name:        []string{"--upload-pack"},
				Description: `When given, and the repository to fetch from is handled by git fetch-pack, --exec=<upload-pack> is passed to the command to specify non-default path for the command run on the other end`,
				Args: []model.Arg{{
					Name: "upload-pack",
				}},
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Pass --quiet to git-fetch-pack and silence any other internally used git commands. Progress is not reported to the standard error stream`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal, unless -q is specified`,
			}, {
				Name:        []string{"-o", "--server-option"},
				Description: `Transmit the given string to the server when communicating using protocol version 2. The given string must not contain a NUL or LF character`,
				Args: []model.Arg{{
					Name: "option",
				}},
			}, {
				Name:        []string{"--show-forced-updates"},
				Description: `By default, git checks if a branch is force-updated during fetch. This can be disabled through fetch.showForcedUpdates, but the --show-forced-updates option guarantees this check occurs`,
			}, {
				Name:        []string{"--no-show-forced-updates"},
				Description: `By default, git checks if a branch is force-updated during fetch. Pass --no-show-forced-updates or set fetch.showForcedUpdates to false to skip this check for performance reasons`,
			}, {
				Name:        []string{"-4", "--ipv4"},
				Description: `Use IPv4 addresses only, ignoring IPv6 addresses`,
			}, {
				Name:        []string{"-6", "--ipv6"},
				Description: `Use IPv6 addresses only, ignoring IPv4 addresses`,
			}, {
				Name:        []string{"--stdin"},
				Description: `Read refspecs, one per line, from stdin in addition to those provided as arguments. The "tag <name>" format is not supported`,
			}},
		}, {
			Name:        []string{"stash"},
			Description: `Temporarily stores all the modified tracked files`,
			Subcommands: []model.Subcommand{{
				Name:        []string{"push"},
				Description: `Save your local modifications to a new stash entry and roll them back to HEAD`,
				Options: []model.Option{{
					Name:        []string{"-p", "--patch"},
					Description: `Interactively select hunks from the diff between HEAD and the working tree to be stashed`,
				}, {
					Name:        []string{"-k", "--keep-index"},
					Description: `All changed already added to the index are left intact`,
				}, {
					Name:        []string{"-u", "--include-untracked"},
					Description: `All untracked files are also stashed and then cleaned up`,
				}, {
					Name:        []string{"-a", "--all"},
					Description: `All ignored and untracked files are also stashed`,
				}, {
					Name:        []string{"-q", "--quiet"},
					Description: `Quiet, suppress feedback messages`,
				}, {
					Name:        []string{"-m", "--message"},
					Description: `Use the given <msg> as the stash message`,
					Args: []model.Arg{{
						Name: "message",
					}},
				}, {
					Name:        []string{"--pathspec-from-file"},
					Description: ``,
				}, {
					Name:        []string{"--"},
					Description: `Separates pathsec from options for disambiguation purposes`,
				}},
			}, {
				Name:        []string{"show"},
				Description: `Show the changes recorded in the stash entry as a diff`,
				Args: []model.Arg{{
					Name:           "stash",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
			}, {
				Name:        []string{"save"},
				Description: `Temporarily stores all the modified tracked files`,
				Args: []model.Arg{{
					Name:       "message",
					IsOptional: true,
				}},
				Options: []model.Option{{
					Name:        []string{"-p", "--patch"},
					Description: `Interactively select hunks from the diff between HEAD and the working tree to be stashed`,
				}, {
					Name:        []string{"-k", "--keep-index"},
					Description: `All changed already added to the index are left intact`,
				}, {
					Name:        []string{"-u", "--include-untracked"},
					Description: `All untracked files are also stashed and then cleaned up`,
				}, {
					Name:        []string{"-a", "--all"},
					Description: `All ignored and untracked files are also stashed`,
				}, {
					Name:        []string{"-q", "--quiet"},
					Description: `Quiet, suppress feedback messages`,
				}},
			}, {
				Name:        []string{"pop"},
				Description: `Restores the most recently stashed files`,
				Args: []model.Arg{{
					Name:           "stash",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
				Options: []model.Option{{
					Name:        []string{"--index"},
					Description: `Tries to reinstate not only the working tree's changes, but also the index's ones`,
				}, {
					Name:        []string{"-q", "--quiet"},
					Description: `Quiet, suppress feedback messages`,
				}},
			}, {
				Name:        []string{"list"},
				Description: `Lists all stashed changesets`,
			}, {
				Name:        []string{"drop"},
				Description: `Discards the most recently stashed changeset`,
				Args: []model.Arg{{
					Name:           "stash",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
				Options: []model.Option{{
					Name:        []string{"-q", "--quiet"},
					Description: `Quiet, suppress feedback messages`,
				}},
			}, {
				Name:        []string{"clear"},
				Description: `Remove all the stash entries`,
			}, {
				Name:        []string{"apply"},
				Description: `Like pop, but do not remove the state from the stash list`,
				Args: []model.Arg{{
					Name:           "stash",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
				Options: []model.Option{{
					Name:        []string{"--index"},
					Description: `Tries to reinstate not only the working tree's changes, but also the index's ones`,
				}, {
					Name:        []string{"-q", "--quiet"},
					Description: `Quiet, suppress feedback messages`,
				}},
			}, {
				Name:        []string{"branch"},
				Description: `Creates and checks out a new branch named`,
				Args: []model.Arg{{
					Name:           "branch",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					Name:           "stash",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
			}, {
				Name:        []string{"create"},
				Description: `Creates a stash with the message <msg>`,
				Args: []model.Arg{{
					Name: "message",
				}},
			}, {
				Name:        []string{"store"},
				Description: `Store a given stash in the stash ref., updating the staft reflog`,
				Args: []model.Arg{{
					Name: "message",
				}, {
					Name:      "commit",
					Generator: nil, // TODO: port over generator
				}},
				Options: []model.Option{{
					Name:        []string{"-m", "--message"},
					Description: `Use the given <msg> as the stash message`,
					Args: []model.Arg{{
						Name: "message",
					}},
				}, {
					Name:        []string{"-q", "--quiet"},
					Description: `Quiet, suppress feedback messages`,
				}},
			}},
		}, {
			Name:        []string{"reflog"},
			Description: `Show history of events with hashes`,
			Options: []model.Option{{
				Name:        []string{"--relative-date"},
				Description: `Show date info`,
			}, {
				Name:        []string{"--all"},
				Description: `Show all refs`,
			}},
		}, {
			Name:        []string{"clone"},
			Description: `Clone a repository into a new directory`,
			Args: []model.Arg{{
				Name:        "repository",
				Description: `Git library to be cloned`,
			}, {
				Templates:   []model.Template{model.TemplateFolders},
				Name:        "directory",
				Description: `Specify the new directory name or target folder`,
				IsOptional:  true,
			}},
			Options: []model.Option{{
				Name:        []string{"-l", "--local"},
				Description: `Bypasses the normal git aware transport mechanism`,
			}, {
				Name:        []string{"--no-hardlinks"},
				Description: `Force the cloning process from a repository on a local filesystem to copy the files under the .git/objects directory instead of using hardlinks`,
			}, {
				Name:        []string{"-s", "--shared"},
				Description: `Automatically setup .git/objects/info/alternates to share the objects with the source repository`,
			}, {
				Name:        []string{"--dry-run"},
				Description: `Do nothing; only show what would happen`,
			}, {
				Name:        []string{"--reference"},
				Description: `If the reference repository is on the local machine, automatically setup`,
				Args: []model.Arg{{
					Name: "repository",
				}},
			}, {
				Name:        []string{"--reference-if-able"},
				Description: `If the reference repository is on the local machine, automatically setup. Non existing directory is skipped with a warning`,
				Args: []model.Arg{{
					Name: "repository",
				}},
			}, {
				Name:        []string{"--dissociate"},
				Description: `Borrow the objects from reference repositories specified with the --reference options only to reduce network transfer, and stop borrowing from them after a clone is made by making necessary local copies of borrowed objects`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Operate quietly. Progress is not reported to the standard error stream`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Run verbosely. Does not affect the reporting of progress status to the standard error stream`,
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal, unless --quiet is specified. This flag forces progress status even if the standard error stream is not directed to a terminal`,
			}, {
				Name:        []string{"--server-option"},
				Description: `Transmit the given string to the server when communicating using protocol version 2. The given string must not contain a NUL or LF character. The server’s handling of server options, including unknown ones, is server-specific. When multiple --server-option=<option> are given, they are all sent to the other side in the order listed on the command line`,
				Args: []model.Arg{{
					Name: "option",
				}},
			}, {
				Name:        []string{"-n", "--no-checkout"},
				Description: `No checkout of HEAD is performed after the clone is complete`,
			}, {
				Name:        []string{"--bare"},
				Description: `Make a bare Git repository. That is, instead of creating <directory> and placing the administrative files in <directory>/.git, make the <directory> itself the $GIT_DIR. This obviously implies the --no-checkout because there is nowhere to check out the working tree. Also the branch heads at the remote are copied directly to corresponding local branch heads, without mapping them to refs/remotes/origin/. When this option is used, neither remote-tracking branches nor the related configuration variables are created`,
			}, {
				Name:        []string{"--sparse"},
				Description: `Initialize the sparse-checkout file so the working directory starts with only the files in the root of the repository. The sparse-checkout file can be modified to grow the working directory as needed`,
			}, {
				Name:        []string{"--filter"},
				Description: `Use the partial clone feature and request that the server sends a subset of reachable objects according to a given object filter. When using --filter, the supplied <filter-spec> is used for the partial clone filter. For example, --filter=blob:none will filter out all blobs (file contents) until needed by Git. Also, --filter=blob:limit=<size> will filter out all blobs of size at least <size>. For more details on filter specifications, see the --filter option in git-rev-list[1]`,
				Args: []model.Arg{{
					Name: "filter spec",
				}},
			}, {
				Name:        []string{"--mirror"},
				Description: `Set up a mirror of the source repository. This implies --bare. Compared to --bare, --mirror not only maps local branches of the source to local branches of the target, it maps all refs (including remote-tracking branches, notes etc.) and sets up a refspec configuration such that all these refs are overwritten by a git remote update in the target repository`,
			}, {
				Name:        []string{"-o", "--origin"},
				Description: `Instead of using the remote name origin to keep track of the upstream repository, use <name>. Overrides clone.defaultRemoteName from the config`,
				Args: []model.Arg{{
					Name: "name",
				}},
			}, {
				Name:        []string{"-b", "--branch"},
				Description: `Instead of pointing the newly created HEAD to the branch pointed to by the cloned repository’s HEAD, point to <name> branch instead. In a non-bare repository, this is the branch that will be checked out. --branch can also take tags and detaches the HEAD at that commit in the resulting repository`,
				Args: []model.Arg{{
					Name: "branch name",
				}},
			}, {
				Name:        []string{"-u", "--upload-pack"},
				Description: `When given, and the repository to clone from is accessed via ssh, this specifies a non-default path for the command run on the other end`,
				Args: []model.Arg{{
					Name: "upload pack",
				}},
			}, {
				Name:        []string{"--template"},
				Description: `Specify the directory from which templates will be used`,
				Args: []model.Arg{{
					Name: "template directory",
				}},
			}, {
				Name:        []string{"-c", "--config"},
				Description: `Set a configuration variable in the newly-created repository; this takes effect immediately after the repository is initialized, but before the remote history is fetched or any files checked out. The key is in the same format as expected by git-config[1] (e.g., core.eol=true). If multiple values are given for the same key, each value will be written to the config file. This makes it safe, for example, to add additional fetch refspecs to the origin remote. Due to limitations of the current implementation, some configuration variables do not take effect until after the initial fetch and checkout. Configuration variables known to not take effect are: remote.<name>.mirror and remote.<name>.tagOpt. Use the corresponding --mirror and --no-tags options instead`,
				Args: []model.Arg{{
					Name: "key=value",
				}},
			}, {
				Name:        []string{"--depth"},
				Description: `Create a shallow clone with a history truncated to the specified number of commits. Implies --single-branch unless --no-single-branch is given to fetch the histories near the tips of all branches. If you want to clone submodules shallowly, also pass --shallow-submodules`,
				Args: []model.Arg{{
					Name: "date",
				}},
			}, {
				Name:        []string{"--shallow-since"},
				Description: `Create a shallow clone with a history after the specified time`,
				Args: []model.Arg{{
					Name: "date",
				}},
			}, {
				Name:        []string{"--shallow-exclude"},
				Description: `Create a shallow clone with a history, excluding commits reachable from a specified remote branch or tag. This option can be specified multiple times`,
				Args: []model.Arg{{
					Name: "revision",
				}},
			}, {
				Name:        []string{"--single-branch"},
				Description: `Clone only the history leading to the tip of a single branch, either specified by the --branch option or the primary branch remote’s HEAD points at. Further fetches into the resulting repository will only update the remote-tracking branch for the branch this option was used for the initial cloning. If the HEAD at the remote did not point at any branch when --single-branch clone was made, no remote-tracking branch is created`,
			}, {
				Name:        []string{"--no-single-branch"},
				Description: `Do not clone only the history leading to the tip of a single branch, either specified by the --branch option or the primary branch remote’s HEAD points at. Further fetches into the resulting repository will only update the remote-tracking branch for the branch this option was used for the initial cloning. If the HEAD at the remote did not point at any branch when --single-branch clone was made, no remote-tracking branch is created`,
			}, {
				Name:        []string{"--no-tags"},
				Description: `Don’t clone any tags, and set remote.<remote>.tagOpt=--no-tags in the config, ensuring that future git pull and git fetch operations won’t follow any tags. Subsequent explicit tag fetches will still work, (see git-fetch[1])`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `After the clone is created, initialize and clone submodules within based on the provided pathspec. If no pathspec is provided, all submodules are initialized and cloned. This option can be given multiple times for pathspecs consisting of multiple entries`,
				Args: []model.Arg{{
					Name:       "pathspec",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--shallow-submodules"},
				Description: `All submodules which are cloned will be shallow with a depth of 1`,
			}, {
				Name:        []string{"--no-shallow-submodules"},
				Description: `Disable --shallow-submodules`,
			}, {
				Name:        []string{"--remote-submodules"},
				Description: `All submodules which are cloned will use the status of the submodule’s remote-tracking branch to update the submodule, rather than the superproject’s recorded SHA-1. Equivalent to passing --remote to git submodule update`,
			}, {
				Name:        []string{"--no-remote-submodules"},
				Description: `Disable --remote-submodules`,
			}, {
				Name:        []string{"-j", "--jobs"},
				Description: `The number of submodules fetched at the same time. Defaults to the submodule.fetchJobs option`,
				Args: []model.Arg{{
					Name:       "n",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--separate-git-dir"},
				Description: `Instead of placing the cloned repository where it is supposed to be, place the cloned repository at the specified directory, then make a filesystem-agnostic Git symbolic link to there. The result is Git repository can be separated from working tree`,
				Args: []model.Arg{{
					Name: "git dir",
				}},
			}},
		}, {
			Name:        []string{"init"},
			Description: `Create an empty Git repository or reinitialize an existing one`,
			Args: []model.Arg{{
				Name:       "directory",
				IsOptional: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-q", "--quiet"},
				Description: `Only print error and warning messages`,
			}, {
				Name:        []string{"--bare"},
				Description: `Create a bare repository`,
			}, {
				Name:        []string{"--object-format"},
				Description: `Specify the given object format`,
				Args: []model.Arg{{
					Name:        "format",
					Suggestions: []model.Suggestion{{Name: []string{`sha1`}}, {Name: []string{`sha256`}}},
				}},
			}, {
				Name:        []string{"--template"},
				Description: `Specify the directory from which templates will be used`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFolders},
					Name:      "template_directory",
				}},
			}, {
				Name:        []string{"--separate-git-dir"},
				Description: `Instead of initializing the repository as a directory to either $GIT_DIR or ./.git/, create a text file there containing the path to the actual repository. This file acts as filesystem-agnostic Git symbolic link to the repository`,
				Args: []model.Arg{{
					Name: "git dir",
				}},
			}, {
				Name:        []string{"-b", "--initial-branch"},
				Description: `Initial branch for new repo`,
				Args: []model.Arg{{
					Name:       "branch-name",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--shared"},
				Description: `Specify that the Git repository is to be shared amongst several users. This allows users belonging to the same group to push into that repository`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{
						Name:        []string{`false`},
						Description: `Use permissions reported by umask(2)`,
					}, {
						Name:        []string{`true`},
						Description: `Make the repository group-writable`,
					}, {
						Name:        []string{`umask`},
						Description: `Use permissions reported by umask(2)`,
					}, {
						Name:        []string{`group`},
						Description: `Make the repository group-writable`,
					}, {
						Name:        []string{`all`},
						Description: `Same as group, but make the repository readable by all users`,
					}, {
						Name:        []string{`world`},
						Description: `Same as group, but make the repository readable by all users`,
					}, {
						Name:        []string{`everybody`},
						Description: `Same as group, but make the repository readable by all users`,
					}, {
						Name:        []string{`0xxx`},
						Description: `0xxx is an octal number and each file will have mode 0xxx. 0xxx will override users' umask(2) value (and not only loosen permissions as group and all does)`,
					}},
					IsOptional: true,
				}},
			}},
		}, {
			Name:        []string{"mv"},
			Description: `Move or rename a file, a directory, or a symlink`,
			Args: []model.Arg{{
				Templates:   []model.Template{model.TemplateFilepaths},
				Name:        "source",
				Description: `File to move`,
			}, {
				Templates:   []model.Template{model.TemplateFolders},
				Name:        "destination",
				Description: `Location to move to`,
			}},
			Options: []model.Option{{
				Name:        []string{"-f", "--force"},
				Description: `Force renaming or moving of a file even if the target exists`,
			}, {
				Name:        []string{"-k"},
				Description: `Skip move or rename actions which would lead to an error condition`,
			}, {
				Name:        []string{"-n", "--dry-run"},
				Description: `Do nothing; only show what would happen`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Report the names of files as they are moved`,
			}},
		}, {
			Name:        []string{"rm"},
			Description: `Remove files from the working tree and from the index`,
			Args: []model.Arg{{
				Suggestions: []model.Suggestion{{
					Name:        []string{`.`},
					Description: `Current directory`,
				}},
				Generator:  nil, // TODO: port over generator
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--"},
				Description: `Used to separate command-line options from the list of files`,
			}, {
				Name:        []string{"--cached"},
				Description: `Only remove from the index`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `Override the up-to-date check`,
			}, {
				Name:        []string{"-r"},
				Description: `Allow recursive removal`,
			}},
		}, {
			Name:        []string{"bisect"},
			Description: `Use binary search to find the commit that introduced a bug`,
			Args: []model.Arg{{
				Templates: []model.Template{model.TemplateFilepaths, model.TemplateFolders},
				Name:      "paths",
			}},
			Subcommands: []model.Subcommand{{
				Name:        []string{"start"},
				Description: `Reset bisect state and start bisection`,
				Args: []model.Arg{{
					Name: "bad",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}, {
					Name: "good",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--term-new"},
					Description: `Specify the alias to mark commits as new during the bisect process`,
					Args: []model.Arg{{
						Name:        "term",
						Description: `Specifying: fixed, would require using git bisect fixed instead of git bisect new`,
					}},
				}, {
					Name:        []string{"--term-bad"},
					Description: `Specify the alias to mark commits as bad during the bisect process`,
					Args: []model.Arg{{
						Name:        "term",
						Description: `Specifying: broken, would require using git bisect broken instead of git bisect bad`,
					}},
				}, {
					Name:        []string{"--term-good"},
					Description: `Specify the alias to mark commits as good during the bisect process`,
					Args: []model.Arg{{
						Name:        "term",
						Description: `Specifying: fixed, would require using git bisect fixed instead of git bisect good`,
					}},
				}, {
					Name:        []string{"--term-old"},
					Description: `Specify the alias to mark commits as old during the bisect process`,
					Args: []model.Arg{{
						Name:        "term",
						Description: `Specifying: broken, would require using git bisect broken instead of git bisect old`,
					}},
				}, {
					Name:        []string{"--no-checkout"},
					Description: `Do not checkout the new working tree at each iteration of the bisection process. Instead just update a special reference named BISECT_HEAD to make it point to the commit that should be tested`,
				}, {
					Name:        []string{"--first-parent"},
					Description: `Follow only the first parent commit upon seeing a merge commit. In detecting regressions introduced through the merging of a branch, the merge commit will be identified as introduction of the bug and its ancestors will be ignored`,
				}, {
					Name:        []string{"--"},
					Description: `Stop taking subcommand arguments and options. Starts taking paths to bisect`,
				}},
			}, {
				Name:        []string{"bad"},
				Description: `Mark commits as bad`,
				Args: []model.Arg{{
					Name: "rev",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"new"},
				Description: `Mark commits as new`,
				Args: []model.Arg{{
					Name: "rev",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"old"},
				Description: `Mark commits as old`,
				Args: []model.Arg{{
					Name: "rev",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
					IsVariadic: true,
				}},
			}, {
				Name:        []string{"good"},
				Description: `Mark commits as good`,
				Args: []model.Arg{{
					Name: "rev",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
					IsVariadic: true,
				}},
			}, {
				Name:        []string{"next"},
				Description: `Find next bisection to test and check it out`,
			}, {
				Name:        []string{"terms"},
				Description: `Show the terms used for old and new commits (default: bad, good)`,
				Options: []model.Option{{
					Name:        []string{"--term-old"},
					Description: `You can get just the old (respectively new) term`,
				}, {
					Name:        []string{"--term-good"},
					Description: `You can get just the old (respectively new) term`,
				}},
			}, {
				Name:        []string{"skip"},
				Description: `Mark <rev>... untestable revisions`,
				Args: []model.Arg{{
					Name: "rev | range",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
					IsVariadic: true,
				}},
			}, {
				Name:        []string{"reset"},
				Description: `Finish bisection search and go back to commit`,
				Args: []model.Arg{{
					Name: "commit",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"visualize", "view"},
				Description: `See the currently remaining suspects in gitk`,
			}, {
				Name:        []string{"replay"},
				Description: `Replay bisection log`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "logfile",
				}},
			}, {
				Name:        []string{"log"},
				Description: `Show bisect log`,
			}, {
				Name:        []string{"run"},
				Description: `Use <cmd>... to automatically bisect`,
				Args: []model.Arg{{
					Name:       "cmd",
					IsCommand:  true,
					IsVariadic: true,
				}},
			}, {
				Name: []string{"help"},
				Args: []model.Arg{{
					Name: "Get help text",
				}},
			}},
		}, {
			Name:        []string{"grep"},
			Description: `Print lines matching a pattern`,
		}, {
			Name:        []string{"show"},
			Description: `Show various types of objects`,
		}, {
			Name:        []string{"branch"},
			Description: `List, create, or delete branches`,
			Options: []model.Option{{
				Name:        []string{"-a", "--all"},
				Description: `List both remote-tracking and local branches`,
				ExclusiveOn: []string{"-r", "--remotes"},
			}, {
				Name:        []string{"-d", "--delete"},
				Description: `Delete fully merged branch`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{
						Name:        []string{`-r`, `--remotes`},
						Description: `Deletes the remote-tracking branches`,
					}},
					Generator:  nil, // TODO: port over generator
					IsVariadic: true,
				}},
			}, {
				Name:        []string{"-D"},
				Description: `Delete branch (even if not merged)`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{
						Name:        []string{`-r`, `--remotes`},
						Description: `Deletes the remote-tracking branches`,
					}},
					Generator:  nil, // TODO: port over generator
					IsVariadic: true,
				}},
			}, {
				Name:        []string{"-m", "--move"},
				Description: `Move/rename a branch and its reflog`,
				Args: []model.Arg{{
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"-M"},
				Description: `Move/rename a branch, even if target exists`,
				Args: []model.Arg{{
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"-c", "--copy"},
				Description: `Copy a branch and its reflog`,
			}, {
				Name:        []string{"-C"},
				Description: `Copy a branch, even if target exists`,
			}, {
				Name:        []string{"-l", "--list"},
				Description: `List branch names`,
			}, {
				Name:        []string{"--create-reflog"},
				Description: `Create the branch's reflog`,
			}, {
				Name:        []string{"--edit-description"},
				Description: `Edit the description for the branch`,
				Args: []model.Arg{{
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}},
			}, {
				Name:        []string{"-f", "--force"},
				Description: `Force creation, move/rename, deletion`,
			}, {
				Name:        []string{"--merged"},
				Description: `Print only branches that are merged`,
				Args: []model.Arg{{
					Name: "commit",
				}},
			}, {
				Name:        []string{"--no-merged"},
				Description: `Print only branches that are not merged`,
				Args: []model.Arg{{
					Name: "commit",
				}},
			}, {
				Name:        []string{"--column"},
				Description: `List branches in columns [=<style>]`,
				ExclusiveOn: []string{"--no-column"},
			}, {
				Name:        []string{"--no-column"},
				Description: `Doesn't display branch listing in columns`,
				ExclusiveOn: []string{"--column"},
			}, {
				Name:        []string{"--sort"},
				Description: `Field name to sort on`,
				Args: []model.Arg{{
					Name: "key",
				}},
			}, {
				Name:        []string{"--points-at"},
				Description: `Print only branches of the object`,
				Args: []model.Arg{{
					Name: "object",
				}},
			}, {
				Name:        []string{"-i", "--ignore-case"},
				Description: `Sorting and filtering are case insensitive`,
			}, {
				Name:        []string{"--format"},
				Description: `Format to use for the output`,
				Args: []model.Arg{{
					Name: "format",
				}},
			}, {
				Name:        []string{"-r", "--remotes"},
				Description: `Lists or deletes (if used with -d) the remote-tracking branches`,
				ExclusiveOn: []string{"-a", "--all"},
			}, {
				Name:        []string{"--show-current"},
				Description: `Prints the name of the current branch`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Shows sha1 and commit subject line for each head, along with relationship to upstream branch when in list mode. If given twice, prints the path of the linked worktree and the name of the upstream branch`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Suppress non-error messages`,
			}, {
				Name:        []string{"--abbrev"},
				Description: `Shows the shortest prefix that is at least <n> hexdigits long that uniquely refers the object`,
				Args: []model.Arg{{
					Name: "Number",
				}},
				ExclusiveOn: []string{"--no-abbrev"},
			}, {
				Name:        []string{"--no-abbrev"},
				Description: `Displays the full sha1s in the output listing`,
				ExclusiveOn: []string{"--abbrev"},
			}, {
				Name:        []string{"-t", "--track"},
				Description: `When creating a new branch, set up 'upstream' configuration`,
				Args: []model.Arg{{
					Name:           "branch",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					Name:       "start point",
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
				ExclusiveOn: []string{"--no-track"},
			}, {
				Name:        []string{"--no-track"},
				Description: `Do not set up 'upstream' configuration, even if the branch.autoSetupMerge configuration variable is true`,
				Args: []model.Arg{{
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
				ExclusiveOn: []string{"--track", "-t"},
			}, {
				Name:        []string{"-u", "--set-upstream-to"},
				Description: `Sets branch to upstream provided`,
				Args: []model.Arg{{
					Name:           "upstream",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
			}, {
				Name:        []string{"--unset-upstream"},
				Description: `Removes the upstream information`,
				Args: []model.Arg{{
					Name:           "upstream",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
			}, {
				Name:        []string{"--contains"},
				Description: `Only lists branches which contain the specified commit`,
				Args: []model.Arg{{
					Name:       "commit",
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-contains"},
				Description: `Only lists branches which don't contain the specified commit`,
				Args: []model.Arg{{
					Name:       "commit",
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--color"},
				Description: `Color branches to highlight current, local, and remote-tracking branches`,
				Args: []model.Arg{{
					Name:        "when",
					Suggestions: []model.Suggestion{{Name: []string{`always`}}, {Name: []string{`never`}}, {Name: []string{`auto`}}},
					IsOptional:  true,
				}},
				ExclusiveOn: []string{"--no-color"},
			}, {
				Name:        []string{"--no-color"},
				Description: `Turns off branch colors`,
				ExclusiveOn: []string{"--color"},
			}},
		}, {
			Name:        []string{"checkout"},
			Description: `Switch branches or restore working tree files`,
			Args: []model.Arg{{
				Name:        "branch, file, tag or commit",
				Description: `Branch, file, tag or commit to switch to`,
				Suggestions: []model.Suggestion{{
					Name:        []string{`-`},
					Description: `Switch to the last used branch`,
				}, {
					Name:        []string{`--`},
					Description: `Do not interpret more arguments as options`,
				}},
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
			}, {
				Templates:   []model.Template{model.TemplateFilepaths},
				Name:        "pathspec",
				Description: `Limits the paths affected by the operation`,
				IsOptional:  true,
				IsVariadic:  true,
			}},
			Options: []model.Option{{
				Name:        []string{"-q", "--quiet"},
				Description: `Quiet, suppress feedback messages`,
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal, unless --quiet is specified. This flag enables progress reporting even if not attached to a terminal, regardless of --quiet`,
			}, {
				Name:        []string{"--no-progress"},
				Description: `Disable progress status reporting`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `When switching branches, proceed even if the index or the working tree differs from HEAD. This is used to throw away local changes`,
			}, {
				Name:        []string{"-2", "--ours"},
				Description: `When checking out paths from the index, check out stage #2 (ours) for unmerged paths`,
			}, {
				Name:        []string{"-3", "--theirs"},
				Description: `When checking out paths from the index, check out stage #3 (theirs) for unmerged paths`,
			}, {
				Name:        []string{"-b"},
				Description: `Create a new branch named <new_branch> and start it at <start_point>; see git-branch[1] for details`,
				Args: []model.Arg{{
					Name: "New Branch",
				}},
			}, {
				Name:        []string{"-B"},
				Description: `Creates the branch <new_branch> and start it at <start_point>; if it already exists, then reset it to <start_point>. This is equivalent to running 'git branch' with '-f'; see git-branch[1] for details`,
				Args: []model.Arg{{
					Name: "New Branch",
				}},
			}, {
				Name:        []string{"-t", "--track"},
				Description: `When creating a new branch, set up 'upstream' configuration`,
			}, {
				Name:        []string{"--no-track"},
				Description: `Do not set up 'upstream' configuration, even if the branch.autoSetupMerge configuration variable is true`,
			}, {
				Name:        []string{"--guess"},
				Description: `If <branch> is not found but there does exist a tracking branch in exactly one remote (call it <remote>) with a matching name, treat as equivalent to $ git checkout -b <branch> --track <remote>/<branch>`,
			}, {
				Name:        []string{"--no-guess"},
				Description: `Disable --guess`,
			}, {
				Name:        []string{"-l"},
				Description: `Create the new branch’s reflog; see git-branch[1] for details`,
			}, {
				Name:        []string{"-d", "--detach"},
				Description: `Rather than checking out a branch to work on it, check out a commit for inspection and discardable experiments. This is the default behavior of git checkout <commit> when <commit> is not a branch name`,
			}, {
				Name:        []string{"--orphan"},
				Description: `Create a new orphan branch, named <new_branch>, started from <start_point> and switch to it`,
				Args: []model.Arg{{
					Name: "New Branch",
				}},
			}, {
				Name:        []string{"--ignore-skip-worktree-bits"},
				Description: `In sparse checkout mode, git checkout -- <paths> would update only entries matched by <paths> and sparse patterns in $GIT_DIR/info/sparse-checkout. This option ignores the sparse patterns and adds back any files in <paths>`,
			}, {
				Name:        []string{"-m", "--merge"},
				Description: `When switching branches, if you have local modifications to one or more files that are different between the current branch and the branch to which you are switching, the command refuses to switch branches in order to preserve your modifications in context`,
			}, {
				Name:        []string{"--conflict"},
				Description: `The same as --merge option above, but changes the way the conflicting hunks are presented, overriding the merge.conflictStyle configuration variable. Possible values are 'merge' (default) and 'diff3' (in addition to what is shown by 'merge' style, shows the original contents)`,
				Args: []model.Arg{{
					Suggestions: []model.Suggestion{{Name: []string{`merge`}}, {Name: []string{`diff3`}}},
					IsOptional:  true,
				}},
			}, {
				Name:        []string{"-p", "--patch"},
				Description: `Interactively select hunks in the difference between the <tree-ish> (or the index, if unspecified) and the working tree`,
			}, {
				Name:        []string{"--ignore-other-worktrees"},
				Description: `Git checkout refuses when the wanted ref is already checked out by another worktree. This option makes it check the ref out anyway. In other words, the ref can be held by more than one worktree`,
			}, {
				Name:        []string{"--overwrite-ignore"},
				Description: `Silently overwrite ignored files when switching branches. This is the default behavior`,
			}, {
				Name:        []string{"--no-overwrite-ignore"},
				Description: `Use --no-overwrite-ignore to abort the operation when the new branch contains ignored files`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `Using --recurse-submodules will update the content of all active submodules according to the commit recorded in the superproject. If local modifications in a submodule would be overwritten the checkout will fail unless -f is used. If nothing (or --no-recurse-submodules) is used, submodules working trees will not be updated. Just like git-submodule[1], this will detach HEAD of the submodule`,
			}, {
				Name:        []string{"--no-recurse-submodules"},
				Description: `Submodules working trees will not be updated`,
			}, {
				Name:        []string{"--overlay"},
				Description: `In the default overlay mode, git checkout never removes files from the index or the working tree`,
			}, {
				Name:        []string{"--no-overlay"},
				Description: `When specifying --no-overlay, files that appear in the index and working tree, but not in <tree-ish> are removed, to make them match <tree-ish> exactly`,
			}, {
				Name:        []string{"--pathspec-from-file"},
				Description: `Pathspec is passed in <file> instead of commandline args`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--pathspec-file-nul"},
				Description: `Only meaningful with --pathspec-from-file`,
			}},
		}, {
			Name:        []string{"cherry-pick"},
			Description: `Apply the changes introduced by some existing commits`,
			Args: []model.Arg{{
				Name:        "commit",
				Description: `Commits to cherry-pick`,
				Generator:   nil, // TODO: port over generator
				IsVariadic:  true,
			}},
			Options: []model.Option{{
				Name:        []string{"--continue"},
				Description: `Continue the operation in progress using the information in .git/sequencer`,
			}, {
				Name:        []string{"--skip"},
				Description: `Skip the current commit and continue with the rest of the sequence`,
			}, {
				Name:        []string{"--quit"},
				Description: `Forget about the current operation in progress`,
			}, {
				Name:        []string{"--abort"},
				Description: `Cancel the operation and return to the pre-sequence state`,
			}, {
				Name:        []string{"-e", "--edit"},
				Description: `With this option, git cherry-pick will let you edit the commit message prior to committing`,
			}, {
				Name:        []string{"--cleanup"},
				Description: `This option determines how the commit message will be cleaned up before being passed on to the commit machinery`,
				Args: []model.Arg{{
					Name:        "mode",
					Description: `Determines how the supplied commit messaged should be cleaned up before committing`,
					Suggestions: []model.Suggestion{{
						Name:        []string{`strip`},
						Description: `Strip leading and trailing empty lines, trailing whitepace, commentary and collapse consecutive empty lines`,
					}, {
						Name:        []string{`whitespace`},
						Description: `Same as strip except #commentary is not removed`,
					}, {
						Name:        []string{`verbatim`},
						Description: `Do not change the message at all`,
					}, {
						Name:        []string{`scissors`},
						Description: `Same as whitespace except that everything from (and including) the line found below is truncated`,
					}, {
						Name:        []string{`default`},
						Description: `Same as strip if the message is to be edited. Otherwise whitespace`,
					}},
				}},
			}, {
				Name:        []string{"-x"},
				Description: `When recording the commit, append a line that says "(cherry picked from commit ...)" to the original commit message in order to indicate which commit this change was cherry-picked from`,
			}, {
				Name:        []string{"-m", "--mainline"},
				Description: `Specifies the parent number (starting from 1) of the mainline and allows cherry-pick to replay the change relative to the specified parent`,
				Args: []model.Arg{{
					Name: "parent-number",
				}},
			}, {
				Name:        []string{"-n", "--no-commit"},
				Description: `Applies changes necessary to cherry-pick each named commit to your working tree and the index without making any commit`,
			}, {
				Name:        []string{"-s", "--signoff"},
				Description: `Add a Signed-off-by trailer at the end of the commit message`,
			}, {
				Name:        []string{"-S", "--gpg-sign"},
				Description: `GPG-sign commits`,
				Args: []model.Arg{{
					Name:        "keyid",
					Description: `Must be stuck to the option without a space`,
					IsOptional:  true,
				}},
				ExclusiveOn: []string{"--no-gpg-sign"},
			}, {
				Name:        []string{"--no-gpg-sign"},
				Description: `Useful to countermand both commit.gpgSign configuration variable, and earlier --gpg-sign`,
				ExclusiveOn: []string{"-S", "--gpg-sign"},
			}, {
				Name:        []string{"--ff"},
				Description: `If the current HEAD is the same as the parent of the cherry-pick'ed commit, the a fast forward to this commit will be performed`,
			}, {
				Name:        []string{"--allow-empty"},
				Description: `Allow empty commits to be preserved automatically in a cherry-pick`,
			}, {
				Name:        []string{"--allow-empty-message"},
				Description: `Allow commits with empty messages to be cherry picked`,
			}, {
				Name:        []string{"--keep-redundant-commits"},
				Description: `Creates an empty commit object. Implies --allow-empty`,
			}, {
				Name:        []string{"--strategy"},
				Description: `Use the given merge strategy. Should only be used once`,
				Args: []model.Arg{{
					Name:        "strategy",
					Suggestions: []model.Suggestion{{Name: []string{`resolve`}}, {Name: []string{`recursive`}}, {Name: []string{`octopus`}}, {Name: []string{`ours`}}, {Name: []string{`subtree`}}},
				}},
			}, {
				Name:        []string{"-X", "--strategy-option"},
				Description: `Pass the merge strategy-specific option through to the merge strategy`,
				Args: []model.Arg{{
					Name:        "option",
					Suggestions: []model.Suggestion{{Name: []string{`ours`}}, {Name: []string{`theirs`}}, {Name: []string{`patience`}}, {Name: []string{`diff-algorithm`}}, {Name: []string{`diff-algorithm=patience`}}, {Name: []string{`diff-algorithm=minimal`}}, {Name: []string{`diff-algorithm=histogram`}}, {Name: []string{`diff-algorithm=myers`}}, {Name: []string{`ignore-space-change`}}, {Name: []string{`ignore-all-space`}}, {Name: []string{`ignore-space-at-eol`}}, {Name: []string{`ignore-cr-at-eol`}}, {Name: []string{`renormalize`}}, {Name: []string{`no-renormalize`}}, {Name: []string{`no-renames`}}, {Name: []string{`find-renames`}}, {Name: []string{`subtree`}}},
				}},
			}, {
				Name:        []string{"--rerere-autoupdate"},
				Description: `Allow the rerere mechanism to update the index with the result of auto-conflict resolution if possible`,
				ExclusiveOn: []string{"--no-rerere-autoupdate"},
			}, {
				Name:        []string{"--no-rerere-autoupdate"},
				Description: `Do not allow the rerere mechanism to update the index with the result of auto-conflict resolution if possible`,
				ExclusiveOn: []string{"--rerere-autoupdate"},
			}},
		}, {
			Name:        []string{"submodule"},
			Description: `Initialize, update or inspect submodules`,
			Options: []model.Option{{
				Name:        []string{"-q", "--quiet"},
				Description: `Only print error messages`,
			}, {
				Name:        []string{"--cached"},
				Description: `The commit stored in the index is used instead`,
			}},
			Subcommands: []model.Subcommand{{
				Name:        []string{"add"},
				Description: `Add the given repository as a submodule at the given path to the changeset to be committed next to the current project`,
				Args: []model.Arg{{
					Name: "repository",
				}, {
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
				}},
				Options: []model.Option{{
					Name:        []string{"-b"},
					Description: `Branch of repository to add as submodule`,
					Args: []model.Arg{{
						Name: "branch",
					}},
				}, {
					Name:        []string{"-f", "--force"},
					Description: `Allow adding an otherwise ignored submodule path`,
				}, {
					Name:        []string{"--name"},
					Description: `It sets the submodule’s name to the given string instead of defaulting to its path`,
					Args: []model.Arg{{
						Name:        "name",
						Description: `Directory name`,
					}},
				}, {
					Name:        []string{"--reference"},
					Description: `Remote repository to be cloned`,
					Args: []model.Arg{{
						Name:        "repository",
						Description: `Remote repository to be cloned`,
					}},
				}, {
					Name:        []string{"--depth"},
					Description: `Create a shallow clone with a history truncated to the specified number of revisions`,
					Args: []model.Arg{{
						Name:        "depth",
						Description: `Specified number of revisions`,
					}},
				}, {
					Name:        []string{"--"},
					Description: `End of subcommand options`,
				}},
			}, {
				Name:        []string{"status"},
				Description: `Show the status of the submodules`,
				Args: []model.Arg{{
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--cached"},
					Description: `Will instead print the SHA-1 recorded in the superproject for each submodule`,
				}, {
					Name:        []string{"--recursive"},
					Description: `Will recurse into nested submodules, and show their status as well`,
				}, {
					Name:        []string{"--"},
					Description: `End of subcommand options`,
				}},
			}, {
				Name:        []string{"init"},
				Description: `Initialize the submodules recorded in the index`,
				Args: []model.Arg{{
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--"},
					Description: `End of subcommand options`,
				}},
			}, {
				Name:        []string{"deinit"},
				Description: `Unregister the given submodules`,
				Args: []model.Arg{{
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"-f", "--force"},
					Description: `The submodule’s working tree will be removed even if it contains local modifications`,
				}, {
					Name:        []string{"--all"},
					Description: `Unregister all submodules in the working tree`,
				}, {
					Name:        []string{"--"},
					Description: `End of subcommand options`,
				}},
			}, {
				Name:        []string{"update"},
				Description: `Update the registered submodules to match what the superproject expects by cloning missing submodules, fetching missing commits in submodules and updating the working tree of the submodules`,
				Args: []model.Arg{{
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--init"},
					Description: `Initialize all submodules for which 'git submodule init' has not been called so far before updating`,
				}, {
					Name:        []string{"--remote"},
					Description: `Instead of using the superproject’s recorded SHA-1 to update the submodule, use the status of the submodule’s remote-tracking branch`,
				}, {
					Name:        []string{"-N", "--no-fetch"},
					Description: `Don’t fetch new objects from the remote site`,
				}, {
					Name:        []string{"--no-recommend-shallow"},
					Description: `Ignore the suggestions`,
				}, {
					Name:        []string{"--recommend-shallow"},
					Description: `The initial clone of a submodule will use the recommended submodule.<name>.shallow as provided by the .gitmodules file`,
				}, {
					Name:        []string{"-f", "--force"},
					Description: `Throw away local changes in submodules when switching to a different commit; and always run a checkout operation in the submodule, even if the commit listed in the index of the containing repository matches the commit checked out in the submodule`,
				}, {
					Name:        []string{"--checkout"},
					Description: `The commit recorded in the superproject will be checked out in the submodule on a detached HEAD`,
				}, {
					Name:        []string{"--rebase"},
					Description: `The current branch of the submodule will be rebased onto the commit recorded in the superproject`,
				}, {
					Name:        []string{"--merge"},
					Description: `The commit recorded in the superproject will be merged into the current branch in the submodule`,
				}, {
					Name:        []string{"--reference"},
					Description: `Remote repository`,
					Args: []model.Arg{{
						Name: "repository",
					}},
				}, {
					Name:        []string{"--depth"},
					Description: `Create a shallow clone with a history truncated to the specified number of revisions`,
					Args: []model.Arg{{
						Name: "depth",
					}},
				}, {
					Name:        []string{"--recursive"},
					Description: `Traverse submodules recursively`,
				}, {
					Name:        []string{"--jobs"},
					Description: `Clone new submodules in parallel with as many jobs`,
					Args: []model.Arg{{
						Name: "n",
					}},
				}, {
					Name:        []string{"--single-branch"},
					Description: `Clone only one branch during update: HEAD or one specified by --branch`,
				}, {
					Name:        []string{"--no-single-branch"},
					Description: `Don't clone only one branch during update: HEAD or one specified by --branch`,
				}, {
					Name:        []string{"--"},
					Description: `End of subcommand options`,
				}},
			}, {
				Name:        []string{"set-branch"},
				Description: `Sets the default remote tracking branch for the submodule`,
				Args: []model.Arg{{
					Templates:   []model.Template{model.TemplateFilepaths},
					Name:        "path",
					Description: `Path to submodule`,
				}},
				Options: []model.Option{{
					Name:        []string{"-b", "--branch"},
					Description: `Branch of repository to add as submodule`,
					Args: []model.Arg{{
						Name:        "branch",
						Description: `Remote branch to be specified`,
					}},
				}, {
					Name:        []string{"-d", "--default"},
					Description: `Removes the submodule.<name>.branch configuration key, which causes the tracking branch to default to the remote HEAD`,
				}, {
					Name:        []string{"--"},
					Description: `End of subcommand options`,
				}},
			}, {
				Name:        []string{"set-url"},
				Description: `Sets the URL of the specified submodule to <newurl>`,
				Args: []model.Arg{{
					Templates:   []model.Template{model.TemplateFilepaths},
					Name:        "path",
					Description: `Path to specified submodule`,
				}, {
					Name:        "newurl",
					Description: `New url of submodule`,
				}},
				Options: []model.Option{{
					Name:        []string{"--"},
					Description: `End of command options`,
				}},
			}, {
				Name:        []string{"summary"},
				Description: `Show commit summary between the given commit (defaults to HEAD) and working tree/index`,
				Args: []model.Arg{{
					Name:       "commit",
					IsOptional: true,
				}, {
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--cached"},
					Description: `This command will recurse into the registered submodules, and sync any nested submodules within`,
				}, {
					Name:        []string{"--files"},
					Description: `Show the series of commits in the submodule between the index of the super project and the working tree of the submodule`,
				}, {
					Name:        []string{"-n"},
					Description: `Limit the summary size (number of commits shown in total). Giving 0 will disable the summary; a negative number means unlimited (the default). This limit only applies to modified submodules. The size is always limited to 1 for added/deleted/typechanged submodules`,
					Args: []model.Arg{{
						Name: "n",
					}},
				}, {
					Name:        []string{"--summary-limit"},
					Description: `Limit the summary size (number of commits shown in total). Giving 0 will disable the summary; a negative number means unlimited (the default). This limit only applies to modified submodules. The size is always limited to 1 for added/deleted/typechanged submodules`,
					Args: []model.Arg{{
						Name: "n",
					}},
				}, {
					Name:        []string{"--"},
					Description: `Everything after this is an argument`,
				}},
			}, {
				Name:        []string{"foreach"},
				Description: `Evaluates an arbitrary shell command in each checked out submodule`,
				Args: []model.Arg{{
					Name: "command",
				}},
				Options: []model.Option{{
					Name:        []string{"--recursive"},
					Description: `This command will recurse into the registered submodules, and sync any nested submodules within`,
				}},
			}, {
				Name:        []string{"sync"},
				Description: `Synchronizes submodules' remote URL configuration setting to the value specified in .gitmodules`,
				Args: []model.Arg{{
					Templates:  []model.Template{model.TemplateFilepaths},
					Name:       "path",
					IsOptional: true,
					IsVariadic: true,
				}},
				Options: []model.Option{{
					Name:        []string{"--recursive"},
					Description: `This command will recurse into the registered submodules, and sync any nested submodules within`,
				}, {
					Name:        []string{"--"},
					Description: `Everything after this is an argument`,
				}},
			}, {
				Name:        []string{"absorbgitdirs"},
				Description: `If a git directory of a submodule is inside the submodule, move the git directory of the submodule into its superproject’s $GIT_DIR/modules path and then connect the git directory and its working directory by setting the core.worktree and adding a .git file pointing to the git directory embedded in the superprojects git directory`,
			}},
		}, {
			Name:        []string{"merge"},
			Description: `Join two or more development histories together`,
			Args: []model.Arg{{
				Name: "branch",
				Suggestions: []model.Suggestion{{
					Name:        []string{`-`},
					Description: `Shorthand for the previous branch`,
				}},
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
				IsOptional:     true,
				IsVariadic:     true,
			}},
			Options: []model.Option{{
				Name:        []string{"--commit"},
				Description: `Perform the merge and commit the result. This option can be used to override --no-commit`,
			}, {
				Name:        []string{"--no-commit"},
				Description: `Perform the merge and stop just before creating a merge commit, to give the user a chance to inspect and further tweak the merge result before committing`,
			}, {
				Name:        []string{"--edit", "-e"},
				Description: `Invoke an editor before committing successful mechanical merge to further edit the auto-generated merge message, so that the user can explain and justify the merge`,
			}, {
				Name:        []string{"--no-edit"},
				Description: `The --no-edit option can be used to accept the auto-generated message (this is generally discouraged). The --edit (or -e) option is still useful if you are giving a draft message with the -m option from the command line and want to edit it in the editor`,
			}, {
				Name:        []string{"--cleanup"},
				Description: `This option determines how the merge message will be cleaned up before committing. See git-commit[1] for more details. In addition, if the <mode> is given a value of scissors, scissors will be appended to MERGE_MSG before being passed on to the commit machinery in the case of a merge conflict`,
				Args: []model.Arg{{
					Name:        "mode",
					Suggestions: []model.Suggestion{{Name: []string{`strip`}}, {Name: []string{`whitespace`}}, {Name: []string{`verbatim`}}, {Name: []string{`scissors`}}, {Name: []string{`default`}}},
				}},
			}, {
				Name:        []string{"--ff"},
				Description: `When possible resolve the merge as a fast-forward (only update the branch pointer to match the merged branch; do not create a merge commit). When not possible (when the merged-in history is not a descendant of the current history), create a merge commit`,
			}, {
				Name:        []string{"--no-ff"},
				Description: `Create a merge commit in all cases, even when the merge could instead be resolved as a fast-forward`,
			}, {
				Name:        []string{"--ff-only"},
				Description: `Resolve the merge as a fast-forward when possible. When not possible, refuse to merge and exit with a non-zero status`,
			}, {
				Name:        []string{"-S", "--gpg-sign"},
				Description: `GPG-sign the resulting merge commit. The keyid argument is optional and defaults to the committer identity; if specified, it must be stuck to the option without a space`,
				Args: []model.Arg{{
					Name:       "keyid",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-gpg-sign"},
				Description: `Is useful to countermand both commit.gpgSign configuration variable, and earlier --gpg-sign`,
			}, {
				Name:        []string{"--log"},
				Description: `In addition to branch names, populate the log message with one-line descriptions from at most <n> actual commits that are being merged. See also git-fmt-merge-msg[1]`,
				Args: []model.Arg{{
					Name:       "n",
					IsOptional: true,
				}},
			}, {
				Name:        []string{"--no-log"},
				Description: `Do not list one-line descriptions from the actual commits being merged`,
			}, {
				Name:        []string{"--signoff"},
				Description: `Add a Signed-off-by trailer by the committer at the end of the commit log message. The meaning of a signoff depends on the project to which you’re committing. For example, it may certify that the committer has the rights to submit the work under the project’s license or agrees to some contributor representation, such as a Developer Certificate of Origin. (See http://developercertificate.org for the one used by the Linux kernel and Git projects.) Consult the documentation or leadership of the project to which you’re contributing to understand how the signoffs are used in that project`,
			}, {
				Name:        []string{"--no-signoff"},
				Description: `Can be used to countermand an earlier --signoff option on the command line`,
			}, {
				Name:        []string{"--stat"},
				Description: `Show a diffstat at the end of the merge. The diffstat is also controlled by the configuration option merge.stat`,
			}, {
				Name:        []string{"-n", "--no-stat"},
				Description: `Do not show a diffstat at the end of the merge`,
			}, {
				Name:        []string{"--squash"},
				Description: `With --squash, --commit is not allowed, and will fail. Produce the working tree and index state as if a real merge happened (except for the merge information), but do not actually make a commit, move the HEAD, or record $GIT_DIR/MERGE_HEAD (to cause the next git commit command to create a merge commit). This allows you to create a single commit on top of the current branch whose effect is the same as merging another branch (or more in case of an octopus)`,
			}, {
				Name:        []string{"--no-squash"},
				Description: `Perform the merge and commit the result. This option can be used to override --squash`,
			}, {
				Name:        []string{"--no-verify"},
				Description: `This option bypasses the pre-merge and commit-msg hooks. See also githooks[5]`,
			}, {
				Name:        []string{"-s", "--strategy"},
				Description: `Use the given merge strategy; can be supplied more than once to specify them in the order they should be tried. If there is no -s option, a built-in list of strategies is used instead (git merge-recursive when merging a single head, git merge-octopus otherwise)`,
				Args: []model.Arg{{
					Name:        "strategy",
					Suggestions: []model.Suggestion{{Name: []string{`resolve`}}, {Name: []string{`recursive`}}, {Name: []string{`octopus`}}, {Name: []string{`ours`}}, {Name: []string{`subtree`}}},
					IsVariadic:  true,
				}},
			}, {
				Name:        []string{"-X", "--strategy-option"},
				Description: `Pass merge strategy specific option through to the merge strategy`,
				Args: []model.Arg{{
					Name:        "option",
					Suggestions: []model.Suggestion{{Name: []string{`ours`}}, {Name: []string{`theirs`}}, {Name: []string{`patience`}}, {Name: []string{`diff-algorithm`}}, {Name: []string{`diff-algorithm=patience`}}, {Name: []string{`diff-algorithm=minimal`}}, {Name: []string{`diff-algorithm=histogram`}}, {Name: []string{`diff-algorithm=myers`}}, {Name: []string{`ignore-space-change`}}, {Name: []string{`ignore-all-space`}}, {Name: []string{`ignore-space-at-eol`}}, {Name: []string{`ignore-cr-at-eol`}}, {Name: []string{`renormalize`}}, {Name: []string{`no-renormalize`}}, {Name: []string{`no-renames`}}, {Name: []string{`find-renames`}}, {Name: []string{`subtree`}}},
				}},
			}, {
				Name:        []string{"--verify-signatures"},
				Description: `Verify that the tip commit of the side branch being merged is signed with a valid key, i.e. a key that has a valid uid: in the default trust model, this means the signing key has been signed by a trusted key. If the tip commit of the side branch is not signed with a valid key, the merge is aborted`,
			}, {
				Name:        []string{"--no-verify-signatures"},
				Description: `Do not verify that the tip commit of the side branch being merged is signed with a valid key`,
			}, {
				Name:        []string{"--summary"},
				Description: `Synonym to --stat ; this is deprecated and will be removed in the future`,
			}, {
				Name:        []string{"--no-summary"},
				Description: `Synonym to --no-stat ; this is deprecated and will be removed in the future`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Operate quietly. Implies --no-progress`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"--progress"},
				Description: `Turn progress on/off explicitly. If neither is specified, progress is shown if standard error is connected to a terminal. Note that not all merge strategies may support progress reporting`,
			}, {
				Name:        []string{"--no-progress"},
				Description: `Turn progress on/off explicitly. If neither is specified, progress is shown if standard error is connected to a terminal. Note that not all merge strategies may support progress reporting`,
			}, {
				Name:        []string{"--autostash"},
				Description: `Automatically create a temporary stash entry before the operation begins, and apply it after the operation ends. This means that you can run the operation on a dirty worktree. However, use with care: the final stash application after a successful merge might result in non-trivial conflicts`,
			}, {
				Name:        []string{"--no-autostash"},
				Description: `Do not automatically create a temporary stash entry before the operation begins, and apply it after the operation ends`,
			}, {
				Name:        []string{"--allow-unrelated-histories"},
				Description: `By default, git merge command refuses to merge histories that do not share a common ancestor. This option can be used to override this safety when merging histories of two projects that started their lives independently. As that is a very rare occasion, no configuration variable to enable this by default exists and will not be added`,
			}, {
				Name:        []string{"-m"},
				Description: `Set the commit message to be used for the merge commit (in case one is created). If --log is specified, a shortlog of the commits being merged will be appended to the specified message. The git fmt-merge-msg command can be used to give a good default for automated git merge invocations. The automated message can include the branch description`,
				Args: []model.Arg{{
					Name: "message",
				}},
			}, {
				Name:        []string{"-F", "--file"},
				Description: `Read the commit message to be used for the merge commit (in case one is created). If --log is specified, a shortlog of the commits being merged will be appended to the specified message`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--rerere-autoupdate"},
				Description: `Allow the rerere mechanism to update the index with the result of auto-conflict resolution if possible`,
			}, {
				Name:        []string{"--no-rerere-autoupdate"},
				Description: `Do not allow the rerere mechanism to update the index with the result of auto-conflict resolution if possible`,
			}, {
				Name:        []string{"--overwrite-ignore"},
				Description: `Silently overwrite ignored files from the merge result. This is the default behavior. Use --no-overwrite-ignore to abort`,
			}, {
				Name:        []string{"--no-overwrite-ignore"},
				Description: `Do not silently overwrite ignored files from the merge result`,
			}, {
				Name:        []string{"--abort"},
				Description: `Abort the current conflict resolution process, and try to reconstruct the pre-merge state. If an autostash entry is present, apply it to the worktree. If there were uncommitted worktree changes present when the merge started, git merge --abort will in some cases be unable to reconstruct these changes. It is therefore recommended to always commit or stash your changes before running git merge. git merge --abort is equivalent to git reset --merge when MERGE_HEAD is present unless MERGE_AUTOSTASH is also present in which case git merge --abort applies the stash entry to the worktree whereas git reset --merge will save the stashed changes in the stash list`,
			}, {
				Name:        []string{"--quit"},
				Description: `Forget about the current merge in progress. Leave the index and the working tree as-is. If MERGE_AUTOSTASH is present, the stash entry will be saved to the stash list`,
			}, {
				Name:        []string{"--continue"},
				Description: `After a git merge stops due to conflicts you can conclude the merge by running git merge --continue (see 'HOW TO RESOLVE CONFLICTS' section below)`,
			}},
		}, {
			Name:        []string{"mergetool"},
			Description: `Open the git tool to fix conflicts`,
		}, {
			Name:        []string{"tag"},
			Description: `Create, list, delete or verify a tag object signed with GPG`,
			Args: []model.Arg{{
				Name:        "tagname",
				Description: `Select a tag`,
				Generator:   nil, // TODO: port over generator
				IsOptional:  true,
			}},
			Options: []model.Option{{
				Name:        []string{"-l", "--list"},
				Description: `List tag names`,
			}, {
				Name:        []string{"-n"},
				Description: `Print <n> lines of each tag message`,
				Args: []model.Arg{{
					Name: "n",
					Suggestions: []model.Suggestion{{
						Name: []string{`1`},
					}, {
						Name: []string{`2`},
					}, {
						Name: []string{`3`},
					}},
				}},
			}, {
				Name:        []string{"-d", "--delete"},
				Description: `Delete tags`,
			}, {
				Name:        []string{"-v", "--verify"},
				Description: `Verify tags`,
			}, {
				Name:        []string{"-a", "--annotate"},
				Description: `Annotated tag, needs a message`,
			}, {
				Name:        []string{"-m", "--message"},
				Description: `Tag message`,
				Args: []model.Arg{{
					Name: "message",
				}},
			}, {
				Name:        []string{"--points-at"},
				Description: `List tags of the given object`,
				Args: []model.Arg{{
					Name: "object",
					Suggestions: []model.Suggestion{{
						Name:        []string{`HEAD`},
						Description: `The most recent commit`,
					}, {
						Name:        []string{`HEAD~<N>`},
						Description: `A specific number of commits`,
					}},
					Generator: nil, // TODO: port over generator
				}},
			}},
		}, {
			Name:        []string{"restore"},
			Description: `Restore working tree files`,
			Args: []model.Arg{{
				Name:       "pathspec",
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-s", "--source"},
				Description: `Restore the working tree files with the content from the given tree`,
				Args: []model.Arg{{
					Name: "tree",
				}},
			}, {
				Name:        []string{"-p", "--patch"},
				Description: `Interactively select hunks in the difference between the restore source and the restore location`,
			}, {
				Name:        []string{"-W", "--worktree"},
				Description: `Use the worktree as the restore location`,
			}, {
				Name:        []string{"-S", "--staged"},
				Description: `Use staging as the restore location`,
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Quiet, suppress feedback messages`,
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal`,
			}, {
				Name:        []string{"--no-progress"},
				Description: `Disable progress status reporting`,
			}, {
				Name:        []string{"-2", "--ours"},
				Description: `When restoring paths from the index, check out stage #2 (ours) for unmerged paths`,
				ExclusiveOn: []string{"--theirs"},
			}, {
				Name:        []string{"-3", "--theirs"},
				Description: `When re out paths from the index, check out stage #3 (theirs) for unmerged paths`,
				ExclusiveOn: []string{"--ours"},
			}, {
				Name:        []string{"-m", "--merge"},
				Description: `When restoring files on the working tree from the index, recreate the conflicted merge in the unmerged paths`,
			}, {
				Name:        []string{"--conflict"},
				Description: `The same as --merge option, but changes the way the conflicting hunks are presented`,
				Args: []model.Arg{{
					Name:        "style",
					Suggestions: []model.Suggestion{{Name: []string{`merge`}}, {Name: []string{`diff3`}}},
				}},
			}, {
				Name:        []string{"--ignore-unmerged"},
				Description: `When restoring files on the working tree from the index, do not abort the operation if there are unmerged entries`,
				ExclusiveOn: []string{"--ours", "--theirs", "--merge", "--conflict"},
			}, {
				Name:        []string{"--ignore-skip-worktree-bits"},
				Description: `In sparse checkout mode, by default is to only update entries matched by <pathspec> and sparse patterns in $GIT_DIR/info/sparse-checkout`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `If <pathspec> names an active submodule and the restore location includes the working tree, the submodule will only be updated if this option is given, in which case its working tree will be restored to the commit recorded in the superproject, and any local modifications overwritten`,
				ExclusiveOn: []string{"--no-recurse-submodules"},
			}, {
				Name:        []string{"--no-recurse-submodules"},
				Description: `Submodules working trees will not be updated`,
				ExclusiveOn: []string{"--recurse-submodules"},
			}, {
				Name:        []string{"--overlay"},
				Description: `In overlay mode, the command never removes files when restoring`,
				ExclusiveOn: []string{"--no-overlay"},
			}, {
				Name:        []string{"--no-overlay"},
				Description: `In no-overlay mode, tracked files that do not appear in the --source tree are removed, to make them match <tree> exactly`,
				ExclusiveOn: []string{"--overlay"},
			}, {
				Name:        []string{"--pathspec-from-file"},
				Description: `Pathspec is passed in <file> instead of commandline args. If <file> is exactly - then standard input is used`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
			}, {
				Name:        []string{"--pathspec-file-nul"},
				Description: `Only meaningful with --pathspec-from-file. Pathspec elements are separated with NUL character and all other characters are taken literally (including newlines and quotes)`,
			}, {
				Name:        []string{"--"},
				Description: `Do not interpret any more arguments as options`,
			}},
		}, {
			Name:        []string{"switch"},
			Description: `Switch branches`,
			Args: []model.Arg{{
				Name:        "branch name",
				Description: `Branch or commit to switch to`,
				Suggestions: []model.Suggestion{{
					Name:        []string{`-`},
					Description: `Switch to the last used branch`,
				}},
				FilterStrategy: model.FilterStrategyFuzzy,
				Generator:      nil, // TODO: port over generator
			}, {
				Name:       "start point",
				Generator:  nil, // TODO: port over generator
				IsOptional: true,
			}},
			Options: []model.Option{{
				Name:        []string{"-c", "--create"},
				Description: `Create a new branch named <new-branch> starting at <start-point> before switching to the branch`,
				Args: []model.Arg{{
					Name: "new branch",
				}, {
					Name:       "start point",
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"-C", "--force-create"},
				Description: `Similar to --create except that if <new-branch> already exists it will be reset to <start-point>`,
				Args: []model.Arg{{
					Name: "new branch",
				}, {
					Name:       "start point",
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
			}, {
				Name:        []string{"-d", "--detach"},
				Description: `Switch to a commit for inspection and discardable experiments`,
			}, {
				Name:        []string{"--guess"},
				Description: `If <branch> is not found but there does exist a tracking branch in exactly one remote (call it <remote>) with a matching name`,
			}, {
				Name:        []string{"--no-guess"},
				Description: `Disable --guess`,
			}, {
				Name:        []string{"-f", "--force"},
				Description: `An alias for --discard-changes`,
			}, {
				Name:        []string{"--discard-changes"},
				Description: `Proceed even if the index or the working tree differs from HEAD. Both the index and working tree are restored to match the switching target`,
			}, {
				Name:        []string{"-m", "--merge"},
				Description: `If you have local modifications to one or more files that are different between the current branch and the branch to which you are switching, the command refuses to switch branches in order to preserve your modifications in context`,
			}, {
				Name:        []string{"--conflict"},
				Description: `The same as --merge option above, but changes the way the conflicting hunks are presented, overriding the merge.conflictStyle configuration variable`,
				Args: []model.Arg{{
					Name:        "style",
					Suggestions: []model.Suggestion{{Name: []string{`merge`}}, {Name: []string{`diff3`}}},
				}},
			}, {
				Name:        []string{"-q", "--quiet"},
				Description: `Quiet, suppress feedback messages`,
			}, {
				Name:        []string{"--progress"},
				Description: `Progress status is reported on the standard error stream by default when it is attached to a terminal`,
			}, {
				Name:        []string{"--no-progress"},
				Description: `Disable progress status reporting`,
			}, {
				Name:        []string{"-t", "--track"},
				Description: `When creating a new branch, set up 'upstream' configuration`,
				Args: []model.Arg{{
					Name:           "branch",
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					Name:       "start point",
					Generator:  nil, // TODO: port over generator
					IsOptional: true,
				}},
				ExclusiveOn: []string{"--no-track"},
			}, {
				Name:        []string{"--no-track"},
				Description: `Do not set up 'upstream' configuration, even if the branch.autoSetupMerge configuration variable is true`,
				Args: []model.Arg{{
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
				}, {
					FilterStrategy: model.FilterStrategyFuzzy,
					Generator:      nil, // TODO: port over generator
					IsOptional:     true,
				}},
				ExclusiveOn: []string{"--track", "-t"},
			}, {
				Name:        []string{"--orphan"},
				Description: `Create a new orphan branch, named <new-branch>`,
				Args: []model.Arg{{
					Name: "new branch",
				}},
			}, {
				Name:        []string{"--ignore-other-worktrees"},
				Description: `Git switch refuses when the wanted ref is already checked out by another worktree`,
			}, {
				Name:        []string{"--recurse-submodules"},
				Description: `Updates the content of all active submodules according to the commit recorded in the superproject`,
				ExclusiveOn: []string{"--no-recurse-submodules"},
			}, {
				Name:        []string{"--no-recurse-submodules"},
				Description: `Submodules working trees will not be updated`,
				ExclusiveOn: []string{"--recurse-submodules"},
			}},
		}, {
			Name:        []string{"worktree"},
			Description: `Manage multiple working trees`,
			Subcommands: []model.Subcommand{{
				Name:        []string{"add"},
				Description: `Create <path> and checkout <commit-ish> into it`,
				Options: []model.Option{{
					Name:        []string{"-f", "--force"},
					Description: `By default, add refuses to create a new working tree when <commit-ish> is a branch name and is already checked out by another working tree, or if <path> is already assigned to some working tree but is missing (for instance, if <path> was deleted manually). This option overrides these safeguards. To add a missing but locked working tree path, specify --force twice`,
				}, {
					Name:        []string{"-d", "--detach"},
					Description: `With add, detach HEAD in the new working tree. See "DETACHED HEAD" in git-checkout[1]`,
				}, {
					Name:        []string{"--checkout"},
					Description: `By default, add checks out <commit-ish>, however, --no-checkout can be used to suppress checkout in order to make customizations, such as configuring sparse-checkout. See "Sparse checkout" in git-read-tree[1]`,
				}, {
					Name:        []string{"--lock"},
					Description: `Keep the working tree locked after creation. This is the equivalent of git worktree lock after git worktree add, but without a race condition`,
				}, {
					Name:        []string{"-b", "-B"},
					Description: `With add, create a new branch named <new-branch> starting at <commit-ish>, and check out <new-branch> into the new working tree. If <commit-ish> is omitted, it defaults to HEAD. By default, -b refuses to create a new branch if it already exists. -B overrides this safeguard, resetting <new-branch> to <commit-ish>`,
					Args: []model.Arg{{
						Name: "new-branch",
					}},
				}},
			}, {
				Name:        []string{"list"},
				Description: `List details of each working tree`,
				Options: []model.Option{{
					Name:        []string{"--porcelain"},
					Description: `With list, output in an easy-to-parse format for scripts. This format will remain stable across Git versions and regardless of user configuration. See below for details`,
				}, {
					Name:        []string{"-v", "--verbose"},
					Description: `With list, output additional information about worktrees (see below)`,
				}, {
					Name:        []string{"--expire"},
					Description: `With list, annotate missing working trees as prunable if they are older than <time>`,
					Args: []model.Arg{{
						Name: "time",
					}},
				}},
			}, {
				Name:        []string{"lock"},
				Description: `If a working tree is on a portable device or network share which is not always mounted, lock it to prevent its administrative files from being pruned automatically`,
				Args: []model.Arg{{
					Name:        "worktree",
					Description: `Working trees can be identified by path, either relative or absolute`,
				}},
				Options: []model.Option{{
					Name:        []string{"--reason"},
					Description: `With lock or with add --lock, an explanation <reason> why the working tree is locked`,
					Args: []model.Arg{{
						Name: "reason",
					}},
				}},
			}, {
				Name:        []string{"move"},
				Description: `Move a working tree to a new location`,
				Args: []model.Arg{{
					Name:        "worktree",
					Description: `Working trees can be identified by path, either relative or absolute`,
				}, {
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "new-path",
				}},
				Options: []model.Option{{
					Name:        []string{"-f", "--force"},
					Description: `Move refuses to move a locked working tree unless --force is specified twice. If the destination is already assigned to some other working tree but is missing (for instance, if <new-path> was deleted manually), then --force allows the move to proceed; use --force twice if the destination is locked`,
				}},
			}, {
				Name:        []string{"prune"},
				Description: `Prune working tree information in $GIT_DIR/worktrees`,
				Options: []model.Option{{
					Name:        []string{"-n", "--dry-run"},
					Description: `With prune, do not remove anything; just report what it would remove`,
				}, {
					Name:        []string{"-v", "--verbose"},
					Description: `With prune, report all removals`,
				}, {
					Name:        []string{"--expire"},
					Description: `With prune, only expire unused working trees older than <time>`,
					Args: []model.Arg{{
						Name: "time",
					}},
				}},
			}, {
				Name:        []string{"remove"},
				Description: `Remove a working tree`,
				Args: []model.Arg{{
					Name:        "worktree",
					Description: `Working trees can be identified by path, either relative or absolute`,
				}},
				Options: []model.Option{{
					Name:        []string{"-f", "--force"},
					Description: `Remove refuses to remove an unclean working tree unless --force is used. To remove a locked working tree, specify --force twice`,
				}},
			}, {
				Name:        []string{"repair"},
				Description: `Repair working tree administrative files, if possible, if they have become corrupted or outdated due to external factors`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "path",
				}},
			}, {
				Name:        []string{"unlock"},
				Description: `Unlock a working tree, allowing it to be pruned, moved or deleted`,
				Args: []model.Arg{{
					Name:        "worktree",
					Description: `Working trees can be identified by path, either relative or absolute`,
				}},
			}},
		}, {
			Name:        []string{"apply"},
			Description: `Apply a patch to files and/or to the index`,
			Args: []model.Arg{{
				Name:       "patch",
				IsVariadic: true,
			}},
			Options: []model.Option{{
				Name:        []string{"--exclude"},
				Description: `Don't apply changes matching the given path`,
				Args: []model.Arg{{
					Name: "path",
				}},
			}, {
				Name:        []string{"--include"},
				Description: `Apply changes matching the given path`,
				Args: []model.Arg{{
					Name: "path",
				}},
			}, {
				Name:        []string{"-p"},
				Description: `Remove <num> leading slashes from traditional diff paths`,
				Args: []model.Arg{{
					Name: "num",
				}},
			}, {
				Name:        []string{"--no-add"},
				Description: `Ignore additions made by the patch`,
			}, {
				Name:        []string{"--stat"},
				Description: `Instead of applying the patch, output diffstat for the input`,
			}, {
				Name:        []string{"--numstat"},
				Description: `Show number of added and deleted lines in decimal notation`,
			}, {
				Name:        []string{"--summary"},
				Description: `Instead of applying the patch, output a summary for the input`,
			}, {
				Name:        []string{"--check"},
				Description: `Instead of applying the patch, see if the patch is applicable`,
			}, {
				Name:        []string{"--index"},
				Description: `Make sure the patch is applicable to the current index`,
			}, {
				Name:        []string{"-N", "--intent-to-add"},
				Description: `Mark new files with "git add --intent-to-add"`,
			}, {
				Name:        []string{"--cached"},
				Description: `Apply a patch without touching the working tree`,
			}, {
				Name:        []string{"--unsafe-paths"},
				Description: `Accept a patch that touches outside the working area`,
			}, {
				Name:        []string{"--apply"},
				Description: `Also apply the patch (use with --stat/--summary/--check)`,
			}, {
				Name:        []string{"-3", "--3way"},
				Description: `Attempt three-way merge if a patch does not apply`,
			}, {
				Name:        []string{"--build-fake-ancestor"},
				Description: `Build a temporary index based on embedded index information`,
				Args: []model.Arg{{
					Name: "file",
				}},
			}, {
				Name:        []string{"-z"},
				Description: `Paths are separated with NUL character`,
			}, {
				Name:        []string{"-C"},
				Description: `Ensure at least <n> lines of context match`,
				Args: []model.Arg{{
					Name: "n",
				}},
			}, {
				Name:        []string{"--whitespace"},
				Description: `Detect new or modified lines that have whitespace errors`,
				Args: []model.Arg{{
					Name: "action",
					Suggestions: []model.Suggestion{{
						Name:        []string{`nowarn`},
						Description: `Turns off the trailing whitespace warning`,
					}, {
						Name:        []string{`warn`},
						Description: `Outputs warnings for a few such errors, but applies the patch as-is (default)`,
					}, {
						Name:        []string{`fix`},
						Description: `Outputs warnings for a few such errors, and applies the patch after fixing them`,
					}, {
						Name:        []string{`error`},
						Description: `Outputs warnings for a few such errors, and refuses to apply the patch`,
					}, {
						Name:        []string{`error-all`},
						Description: `Similar to "error" but shows all errors`,
					}},
				}},
			}, {
				Name:        []string{"--ignore-space-change", "--ignore-whitespace"},
				Description: `Ignore changes in whitespace when finding context`,
			}, {
				Name:        []string{"-R", "--reverse"},
				Description: `Apply the patch in reverse`,
			}, {
				Name:        []string{"--unidiff-zero"},
				Description: `Don't expect at least one line of context`,
			}, {
				Name:        []string{"--reject"},
				Description: `Leave the rejected hunks in corresponding *.rej files`,
			}, {
				Name:        []string{"--allow-overlap"},
				Description: `Allow overlapping hunks`,
			}, {
				Name:        []string{"-v", "--verbose"},
				Description: `Be verbose`,
			}, {
				Name:        []string{"--inaccurate-eof"},
				Description: `Tolerate incorrectly detected missing new-line at the end of file`,
			}, {
				Name:        []string{"--recount"},
				Description: `Do not trust the line counts in the hunk headers`,
			}, {
				Name:        []string{"--directory"},
				Description: `Prepend <root> to all filenames`,
				Args: []model.Arg{{
					Name: "root",
				}},
			}},
		}, {
			Name:        []string{"daemon"},
			Description: `A really simple server for Git repositories`,
			Args: []model.Arg{{
				Name:        "directory",
				Description: `A directory to add to the whitelist of allowed directories. Unless --strict-paths is specified this will also include subdirectories of each named directory`,
				IsVariadic:  true,
			}},
			Options: []model.Option{{
				Name:        []string{"--strict-paths"},
				Description: `Match paths exactly (i.e. don’t allow "/foo/repo" when the real path is "/foo/repo.git" or "/foo/repo/.git") and don’t do user-relative paths.  git daemon will refuse to start when this option is enabled and no whitelist is specified`,
			}, {
				Name:        []string{"--base-path"},
				Description: `Remap all the path requests as relative to the given path`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFolders},
					Name:      "path",
				}},
			}, {
				Name:        []string{"--base-path-relaxed"},
				Description: `If --base-path is enabled and repo lookup fails, with this option git daemon will attempt to lookup without prefixing the base path. This is useful for switching to --base-path usage, while still allowing the old paths`,
			}, {
				Name:        []string{"--interpolated-path"},
				Description: `To support virtual hosting, an interpolated path template can be used to dynamically construct alternate paths. The template supports %H for the target hostname as supplied by the client but converted to all lowercase, %CH for the canonical hostname, %IP for the server’s IP address, %P for the port number, and %D for the absolute path of the named repository. After interpolation, the path is validated against the directory whitelist`,
				Args: []model.Arg{{
					Name: "path-template",
				}},
			}, {
				Name:        []string{"--export-all"},
				Description: `Allow pulling from all directories that look like Git repositories (have the objects and refs subdirectories), even if they do not have the git-daemon-export-ok file`,
			}, {
				Name:        []string{"--inetd"},
				Description: `Have the server run as an inetd service`,
				ExclusiveOn: []string{"--pid-file", "--user", "--group"},
			}, {
				Name:        []string{"--listen"},
				Description: `Listen on a specific IP address or hostname. IP addresses can be either an IPv4 address or an IPv6 address if supported. If IPv6 is not supported, then --listen=hostname is also not supported and --listen must be given an IPv4 address. Can be given more than once. Incompatible with --inetd option`,
				Args: []model.Arg{{
					Name: "host_or_ipaddr",
				}},
			}, {
				Name:        []string{"--port"},
				Description: `Listen on an alternative port. Incompatible with --inetd option`,
				Args: []model.Arg{{
					Name: "port",
				}},
			}, {
				Name:        []string{"--init-timeout"},
				Description: `Timeout (in seconds) between the moment the connection is established and the client request is received (typically a rather low value, since that should be basically immediate)`,
				Args: []model.Arg{{
					Name: "timeout",
				}},
			}, {
				Name:        []string{"--max-connections"},
				Description: `Maximum number of concurrent clients, defaults to 32. Set it to zero for no limit`,
				Args: []model.Arg{{
					Name: "maximum",
				}},
			}, {
				Name:        []string{"--syslog"},
				Description: `Short for --log-destination=syslog`,
			}, {
				Name:        []string{"--log-destination"},
				Description: `Send log messages to the specified destination. Note that this option does not imply --verbose, thus by default only error conditions will be logged. The default destination is syslog if --inetd or --detach is specified, otherwise stderr`,
				Args: []model.Arg{{
					Name: "destination",
					Suggestions: []model.Suggestion{{
						Name:        []string{`stderr`},
						Description: `Write to standard error. Note that if --detach is specified, the process disconnects from the real standard error, making this destination effectively equivalent to none`,
					}, {
						Name:        []string{`syslog`},
						Description: `Write to syslog, using the git-daemon identifier`,
					}, {
						Name:        []string{`none`},
						Description: `Disable all logging`,
					}},
				}},
			}, {
				Name:        []string{"--user-path"},
				Description: `Allow ~user notation to be used in requests. When specified with no parameter, requests to git://host/~alice/foo is taken as a request to access foo repository in the home directory of user alice. If --user-path=some-path is specified, the same request is taken as a request to access the some-path/foo repository in the home directory of user alice`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFolders},
					Name:      "path",
				}},
			}, {
				Name:        []string{"--verbose"},
				Description: `Log details about the incoming connections and requested files`,
			}, {
				Name:        []string{"--detach"},
				Description: `Detach from the shell. Implies --syslog`,
			}, {
				Name:        []string{"--pid-file"},
				Description: `Save the process id in the provided file`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "file",
				}},
				ExclusiveOn: []string{"--inetd"},
			}, {
				Name:        []string{"--user"},
				Description: `Change daemon’s uid and gid before entering the service loop. When only --user is given without --group, the primary group ID for the user is used. The values of the option are given to getpwnam(3) and getgrnam(3) and numeric IDs are not supported`,
				Args: []model.Arg{{
					Name: "user",
				}},
				ExclusiveOn: []string{"--inetd"},
			}, {
				Name:        []string{"--group"},
				Description: `Change daemon’s gid before entering the service loop. The value of this option is given to getgrnam(3) and numeric IDs are not supported`,
				ExclusiveOn: []string{"--inetd"},
			}, {
				Name:        []string{"--enable"},
				Description: `Enable the service site-wide per default`,
				Args: []model.Arg{{
					Name: "service",
					Suggestions: []model.Suggestion{{
						Name:        []string{`upload-pack`},
						Description: `This serves git fetch-pack and git ls-remote clients. It is enabled by default, but a repository can disable it by setting daemon.uploadpack configuration item to false`,
					}, {
						Name:        []string{`upload-archive`},
						Description: `This serves git archive --remote. It is disabled by default, but a repository can enable it by setting daemon.uploadarch configuration item to true`,
					}, {
						Name:        []string{`receive-pack`},
						Description: `This serves git send-pack clients, allowing anonymous push. It is disabled by default, as there is no authentication in the protocol (in other words, anybody can push anything into the repository, including removal of refs). This is solely meant for a closed LAN setting where everybody is friendly. This service can be enabled by setting daemon.receivepack configuration item to true`,
					}},
				}},
			}, {
				Name:        []string{"--disable"},
				Description: `Disable the service site-wide per default. Note that a service disabled site-wide can still be enabled per repository if it is marked overridable and the repository enables the service with a configuration item`,
				Args: []model.Arg{{
					Name: "service",
					Suggestions: []model.Suggestion{{
						Name:        []string{`upload-pack`},
						Description: `This serves git fetch-pack and git ls-remote clients. It is enabled by default, but a repository can disable it by setting daemon.uploadpack configuration item to false`,
					}, {
						Name:        []string{`upload-archive`},
						Description: `This serves git archive --remote. It is disabled by default, but a repository can enable it by setting daemon.uploadarch configuration item to true`,
					}, {
						Name:        []string{`receive-pack`},
						Description: `This serves git send-pack clients, allowing anonymous push. It is disabled by default, as there is no authentication in the protocol (in other words, anybody can push anything into the repository, including removal of refs). This is solely meant for a closed LAN setting where everybody is friendly. This service can be enabled by setting daemon.receivepack configuration item to true`,
					}},
				}},
			}, {
				Name:        []string{"--allow-override"},
				Description: `Allow overriding the site-wide default with per repository configuration. By default, all the services may be overridden`,
				Args: []model.Arg{{
					Name: "service",
					Suggestions: []model.Suggestion{{
						Name:        []string{`upload-pack`},
						Description: `This serves git fetch-pack and git ls-remote clients. It is enabled by default, but a repository can disable it by setting daemon.uploadpack configuration item to false`,
					}, {
						Name:        []string{`upload-archive`},
						Description: `This serves git archive --remote. It is disabled by default, but a repository can enable it by setting daemon.uploadarch configuration item to true`,
					}, {
						Name:        []string{`receive-pack`},
						Description: `This serves git send-pack clients, allowing anonymous push. It is disabled by default, as there is no authentication in the protocol (in other words, anybody can push anything into the repository, including removal of refs). This is solely meant for a closed LAN setting where everybody is friendly. This service can be enabled by setting daemon.receivepack configuration item to true`,
					}},
				}},
			}, {
				Name:        []string{"--forbid-override"},
				Description: `Forbid overriding the site-wide default with per repository configuration. By default, all the services may be overridden`,
				Args: []model.Arg{{
					Name: "service",
					Suggestions: []model.Suggestion{{
						Name:        []string{`upload-pack`},
						Description: `This serves git fetch-pack and git ls-remote clients. It is enabled by default, but a repository can disable it by setting daemon.uploadpack configuration item to false`,
					}, {
						Name:        []string{`upload-archive`},
						Description: `This serves git archive --remote. It is disabled by default, but a repository can enable it by setting daemon.uploadarch configuration item to true`,
					}, {
						Name:        []string{`receive-pack`},
						Description: `This serves git send-pack clients, allowing anonymous push. It is disabled by default, as there is no authentication in the protocol (in other words, anybody can push anything into the repository, including removal of refs). This is solely meant for a closed LAN setting where everybody is friendly. This service can be enabled by setting daemon.receivepack configuration item to true`,
					}},
				}},
			}, {
				Name:        []string{"--informative-errors"},
				Description: `When informative errors are turned on, git-daemon will report more verbose errors to the client, differentiating conditions like "no such repository" from "repository not exported". This is more convenient for clients, but may leak information about the existence of unexported repositories. When informative errors are not enabled, all errors report "access denied" to the client`,
				ExclusiveOn: []string{"--no-informative-errors"},
			}, {
				Name:        []string{"--no-informative-errors"},
				Description: `Turn off informative errors. This option is the default. See --informative-errors for more information`,
				ExclusiveOn: []string{"--informative-errors"},
			}, {
				Name: []string{"--access-hook"},
				Description: `Every time a client connects, first run an external command specified by the <path> with service name (e.g. "upload-pack"), path to the repository, hostname (%H), canonical hostname (%CH), IP address (%IP), and TCP port (%P) as its command-line arguments. The external command can decide to decline the service by exiting with a non-zero status (or to allow it by exiting with a zero status). It can also look at the $REMOTE_ADDR and $REMOTE_PORT environment variables to learn about the requestor when making this decision.

The external command can optionally write a single line to its standard output to be sent to the requestor as an error message when it declines the service`,
				Args: []model.Arg{{
					Templates: []model.Template{model.TemplateFilepaths},
					Name:      "path",
				}},
			}},
		}},
	}
}
