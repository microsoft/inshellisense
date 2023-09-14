package azure

import (
	"context"
	"encoding/json"
	"log/slog"
	"os/exec"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/keyvault/armkeyvault"
	"github.com/cpendery/clac/autocomplete/model"
	"github.com/google/uuid"
)

type azShowAccountResponse struct {
	SubscriptionName *string `json:"name,omitempty"`
}

func getActiveSubscription() *string {
	output, err := exec.Command("az", "show", "account", "-o", "json").Output()
	if err != nil {
		slog.Error("az account information command failed", slog.String("error", err.Error()))
		return nil
	}
	var accountInfo azShowAccountResponse
	if err := json.Unmarshal(output, &accountInfo); err != nil {
		slog.Error("az account information command provided invalid output", slog.String("error", err.Error()))
		return nil
	}
	return accountInfo.SubscriptionName
}

var ListKeyVaultsGenerator = &model.Generator{
	Id: uuid.New(),
	Function: func() []model.TermSuggestion {
		suggestions := []model.TermSuggestion{}
		subscription := getActiveSubscription()
		if subscription == nil {
			return suggestions
		}
		cred, err := azidentity.NewDefaultAzureCredential(nil)
		if err != nil {
			slog.Error("unable to load azure default credentials", slog.String("error", err.Error()))
			return suggestions
		}
		client, err := armkeyvault.NewVaultsClient(*subscription, cred, nil)
		if err != nil {
			slog.Error("unable to create new azure vaults client", slog.String("error", err.Error()))
			return suggestions
		}
		pager := client.NewListPager(nil)
		for pager.More() {
			page, err := pager.NextPage(context.Background())
			if err != nil {
				slog.Error("unable to request new page of vaults", slog.String("error", err.Error()))
				return suggestions
			}
			for _, vault := range page.Value {
				if vault.Name != nil {
					suggestions = append(suggestions, model.TermSuggestion{
						Name:        *vault.Name,
						Description: "Azure Key Vault",
					})
				}
			}
		}
		return suggestions
	},
}
