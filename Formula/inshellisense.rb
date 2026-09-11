class Inshellisense < Formula
  desc "IDE style command line auto complete"
  homepage "https://github.com/microsoft/inshellisense"
  version "0.0.4"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.4/microsoft-inshellisense-darwin-arm64-0.0.4.tgz"
      sha256 "91e13ed5f8e3a247833dcf3bff5a6180b357e75f9e828626b7bd600735f8c6a2"
    end

    on_intel do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.4/microsoft-inshellisense-darwin-x64-0.0.4.tgz"
      sha256 "81a8968c82629dd480061857195f6cca13d6fef57d948edb2a08e014dd7ad7f2"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.4/microsoft-inshellisense-linux-arm64-0.0.4.tgz"
      sha256 "93d9cdb4e78b4ced584af69ab7a97d24aa0a35a174729e04d3e2efd9c5e4a19a"
    end

    on_intel do
      url "https://github.com/microsoft/inshellisense/releases/download/0.0.4/microsoft-inshellisense-linux-x64-0.0.4.tgz"
      sha256 "5953406744227a285e98056e70fd9d2e59802ba77ea7757c21c32cc56f90ad5f"
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
	