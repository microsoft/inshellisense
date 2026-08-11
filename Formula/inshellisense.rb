class Inshellisense < Formula
  desc "IDE style command line auto complete"
  homepage "https://github.com/microsoft/inshellisense"
  version "0.0.3"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.3/microsoft-inshellisense-darwin-arm64-0.0.3.tgz"
      sha256 "a5ad5eead7a363aec1695dddbb6f64044710599ab46b32d77c64cc813bd5a855"
    end

    on_intel do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.3/microsoft-inshellisense-darwin-x64-0.0.3.tgz"
      sha256 "7595b771ed4e9085affb1ab364d2f7cdca8efb22bf7578299a2e538570ba2131"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.3/microsoft-inshellisense-linux-arm64-0.0.3.tgz"
      sha256 "f3c9dda9b97fb8ecb87e2ac216b2c3fd49619a4bbc3e9944e7d6088157d55abd"
    end

    on_intel do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.3/microsoft-inshellisense-linux-x64-0.0.3.tgz"
      sha256 "fd784d550986f54ac8428c1b813397d7f7cee60ca4381afda406b03936f434f2"
    end
  end

  def install
    binary = Dir["inshellisense-*"].fetch(0)
    bin.install binary => "inshellisense"
    bin.install_symlink "inshellisense" => "is"
  end

  test do
    system bin/"inshellisense", "--version"
  end
end
	