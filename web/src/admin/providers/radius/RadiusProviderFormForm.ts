import "@goauthentik/admin/common/ak-flow-search/ak-branded-flow-search";
import "@goauthentik/admin/common/ak-flow-search/ak-flow-search";
import { DEFAULT_CONFIG } from "@goauthentik/common/api/config";
import { ascii_letters, digits, first, randomString } from "@goauthentik/common/utils";
import { DualSelectPair } from "@goauthentik/elements/ak-dual-select/types";
import "@goauthentik/elements/forms/FormGroup";
import "@goauthentik/elements/forms/HorizontalFormElement";
import "@goauthentik/elements/forms/SearchSelect";

import { msg } from "@lit/localize";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

import {
    FlowsInstancesListDesignationEnum,
    PropertymappingsApi,
    RadiusProviderPropertyMapping,
    ValidationError,
} from "@goauthentik/api";

export async function radiusPropertyMappingsProvider(page = 1, search = "") {
    const propertyMappings = await new PropertymappingsApi(
        DEFAULT_CONFIG,
    ).propertymappingsProviderRadiusList({
        ordering: "name",
        pageSize: 20,
        search: search.trim(),
        page,
    });
    return {
        pagination: propertyMappings.pagination,
        options: propertyMappings.results.map((m) => [m.pk, m.name, m.name, m]),
    };
}

export function makeRadiusPropertyMappingsSelector(instanceMappings?: string[]) {
    const localMappings = instanceMappings ? new Set(instanceMappings) : undefined;
    return localMappings
        ? ([pk, _]: DualSelectPair) => localMappings.has(pk)
        : ([_0, _1, _2, _]: DualSelectPair<RadiusProviderPropertyMapping>) => [];
}

const mfaHelp = msg(
    "When enabled, code-based multi-factor authentication can be used by appending a semicolon and the TOTP code to the password. This should only be enabled if all users that will bind to this provider have a TOTP device configured, as otherwise a password may incorrectly be rejected if it contains a semicolon.",
);

const clientNetworksHelp = msg(
    "List of CIDRs (comma-seperated) that clients can connect from. A more specific CIDR will match before a looser one. Clients connecting from a non-specified CIDR will be dropped.",
);

// All Provider objects have an Authorization flow, but not all providers have an Authentication
// flow. Radius needs only one field, but it is not the Authorization field, it is an
// Authentication field. So, yeah, we're using the authorization field to store the
// authentication information, which is why the ak-branded-flow-search call down there looks so
// weird-- we're looking up Authentication flows, but we're storing them in the Authorization
// field of the target Provider.

export function renderForm(
    provider?: Partial<RadiusProvider>,
    errors: ValidationError = {},
    brand?: CurrentBrand,
) {
    return html`
        <ak-text-input
            name="name"
            label=${msg("Name")}
            value=${ifDefined(provider?.name)}
            .errorMessages=${errors?.name ?? []}
            required
        >
        </ak-text-input>

        <ak-form-element-horizontal
            label=${msg("Authentication flow")}
            ?required=${true}
            name="authorizationFlow"
            .errorMessages=${errors?.authorizationFlow ?? []}
        >
            <ak-branded-flow-search
                flowType=${FlowsInstancesListDesignationEnum.Authentication}
                .currentFlow=${provider?.authorizationFlow}
                .brandFlow=${brand?.flowAuthentication}
                required
            ></ak-branded-flow-search>
            <p class="pf-c-form__helper-text">${msg("Flow used for users to authenticate.")}</p>
        </ak-form-element-horizontal>

        <ak-form-element-horizontal name="mfaSupport">
            <label class="pf-c-switch">
                <input
                    class="pf-c-switch__input"
                    type="checkbox"
                    ?checked=${provider?.mfaSupport ?? true}
                />
                <span class="pf-c-switch__toggle">
                    <span class="pf-c-switch__toggle-icon">
                        <i class="fas fa-check" aria-hidden="true"></i>
                    </span>
                </span>
                <span class="pf-c-switch__label">${msg("Code-based MFA Support")}</span>
            </label>
            <p class="pf-c-form__helper-text">${mfaHelp}</p>
        </ak-form-element-horizontal>

        <ak-form-group expanded>
            <span slot="header"> ${msg("Protocol settings")} </span>
            <div slot="body" class="pf-c-form">
                <ak-text-input
                    name="sharedSecret"
                    label=${msg("Shared secret")}
                    .errorMessages=${errors?.sharedSecret ?? []}
                    value=${first(
                        provider?.sharedSecret,
                        randomString(128, ascii_letters + digits),
                    )}
                    required
                ></ak-text-input>
                <ak-text-input
                    name="clientNetworks"
                    label=${msg("Client Networks")}
                    value=${first(provider?.clientNetworks, "0.0.0.0/0, ::/0")}
                    .errorMessages=${errors?.clientNetworks ?? []}
                    required
                    help=${clientNetworksHelp}
                ></ak-text-input>
                <ak-form-element-horizontal
                    label=${msg("Property mappings")}
                    name="propertyMappings"
                >
                    <ak-dual-select-dynamic-selected
                        .provider=${radiusPropertyMappingsProvider}
                        .selector=${makeRadiusPropertyMappingsSelector(provider?.propertyMappings)}
                        available-label=${msg("Available Property Mappings")}
                        selected-label=${msg("Selected Property Mappings")}
                    ></ak-dual-select-dynamic-selected>
                </ak-form-element-horizontal>
            </div>
        </ak-form-group>
        <ak-form-group>
            <span slot="header"> ${msg("Advanced flow settings")} </span>
            <div slot="body" class="pf-c-form">
                <ak-form-element-horizontal
                    label=${msg("Invalidation flow")}
                    name="invalidationFlow"
                    required
                >
                    <ak-flow-search
                        flowType=${FlowsInstancesListDesignationEnum.Invalidation}
                        .currentFlow=${provider?.invalidationFlow}
                        .errorMessages=${errors?.invalidationFlow ?? []}
                        defaultFlowSlug="default-provider-invalidation-flow"
                        required
                    ></ak-flow-search>
                    <p class="pf-c-form__helper-text">
                        ${msg("Flow used when logging out of this provider.")}
                    </p>
                </ak-form-element-horizontal>
            </div></ak-form-group
        >
    `;
}