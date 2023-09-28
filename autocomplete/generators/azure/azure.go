// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

package azure

import (
	"encoding/json"
	"log/slog"
	"os/exec"
	"strings"

	"github.com/google/uuid"
	"github.com/microsoft/clac/autocomplete/model"
)

type azListKeyvaultsResponse struct {
	VaultName *string `json:"name,omitempty"`
}

type azListKeyvaultKeysResponse struct {
	KeyName *string `json:"name,omitempty"`
}

var ListKeyVaultsGenerator = &model.Generator{
	Id:     uuid.New(),
	Script: "az keyvault list -o json",
	PostProcess: func(s string) []model.TermSuggestion {
		suggestions := []model.TermSuggestion{}

		vaults := []azListKeyvaultsResponse{}
		if err := json.Unmarshal([]byte(s), &vaults); err != nil {
			slog.Error("unable to load list keyvault response", slog.String("error", err.Error()))
			return suggestions
		}

		for _, vault := range vaults {
			if vault.VaultName == nil {
				continue
			}
			suggestions = append(suggestions, model.TermSuggestion{
				Name:        `"` + *vault.VaultName + `"`,
				Description: "Azure Key Vault",
			})
		}
		return suggestions
	},
}

var ListKeyVaultsKeysGenerator = &model.Generator{
	Id:        uuid.New(),
	SkipCache: true,
	Function: func(cmdTokens []string) []model.TermSuggestion {
		suggestions := []model.TermSuggestion{}
		var vaultName *string = nil
		for idx, token := range cmdTokens {
			if strings.TrimSpace(token) == "--vault-name" && idx+1 < len(cmdTokens) {
				vaultName = &cmdTokens[idx+1]
			}
		}

		if vaultName == nil {
			return suggestions
		}

		output, err := exec.Command("az", "keyvault", "key", "list", "--vault-name", strings.Trim(*vaultName, `"'`), "-o", "json").Output()
		if err != nil {
			slog.Error("unable to request list keys", slog.String("error", err.Error()))
			return suggestions
		}
		keys := []azListKeyvaultKeysResponse{}

		if err := json.Unmarshal([]byte(output), &keys); err != nil {
			slog.Error("unable to load list keys response", slog.String("error", err.Error()))
			return suggestions
		}

		for _, key := range keys {
			if key.KeyName == nil {
				continue
			}
			suggestions = append(suggestions, model.TermSuggestion{
				Name:        `"` + *key.KeyName + `"`,
				Description: "Azure Key Vault",
			})
		}
		return suggestions
	},
}
