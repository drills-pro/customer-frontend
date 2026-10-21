/**
 * Request and response shapes for organizations, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */

export type ApiOrgPlan = 'free' | 'team' | 'enterprise';
export type ApiOrgRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ApiVisibility = 'organization' | 'private';

/** What a plan allows; also served on its own by `GET /v1/catalog/plans`. */
export type ApiPlanLimits = {
  seats: number;
  projects: number;
  credits: number;
  /** Display price, e.g. `$249/mo` or `Custom`. */
  price: string;
};

export type ApiOrganization = {
  id: string;
  name: string;
  /** URL handle, unique across DRILLS. */
  slug: string;
  description: string;
  color: string;
  plan: ApiOrgPlan;
  created_at: string;
  /** The caller's role in this organization. */
  your_role: ApiOrgRole;
  default_project_visibility: ApiVisibility;
  require_two_factor: boolean;
  allow_domain_join: boolean;
  /**
   * Counts for the switcher and the organization cards. Sent with every
   * organization so a list needs one request, not one per row.
   */
  summary: {
    projects: number;
    members: number;
    invited: number;
    running_trainings: number;
    deployments: number;
    credits_used: number;
  };
  limits: ApiPlanLimits;
};

/** `POST /v1/organizations`. A taken slug answers 409. */
export type CreateOrganizationRequest = {
  name: string;
  slug: string;
  plan: ApiOrgPlan;
  color: string;
};

/** `PATCH /v1/organizations/{id}`. Every field is optional. */
export type UpdateOrganizationRequest = Partial<
  Pick<
    ApiOrganization,
    'name' | 'slug' | 'description' | 'color' | 'default_project_visibility' | 'require_two_factor' | 'allow_domain_join'
  >
>;

export type ApiOrgMember = {
  id: string;
  name: string;
  email: string;
  color: string;
  role: ApiOrgRole;
  /** An invited member has not accepted yet. */
  status: 'active' | 'invited';
  joined_at: string;
  /** `null` until the member has signed in. */
  last_active_at: string | null;
  is_you: boolean;
};

/** `POST /v1/organizations/{id}/invitations`. */
export type InviteMembersRequest = {
  emails: string[];
  role: ApiOrgRole;
};

/** An invitation addressed to the caller, `GET /v1/invitations`. */
export type ApiInvitation = {
  id: string;
  invited_by: string;
  sent_at: string;
  role: ApiOrgRole;
  organization: Pick<ApiOrganization, 'id' | 'name' | 'slug' | 'description' | 'color' | 'plan'>;
};

/** `GET /v1/organizations/{id}/billing`. */
export type ApiBilling = {
  plan: ApiOrgPlan;
  plan_name: string;
  credits_used: number;
  credits_total: number;
  /** The next renewal date. */
  renews_at: string;
  payment_method: {
    brand: string;
    last4: string;
    /** `MM/YY`. */
    expires: string;
  } | null;
};

/** `GET /v1/organizations/{id}/invoices`. */
export type ApiInvoice = {
  id: string;
  /** First day of the billed month. */
  period_start: string;
  amount_usd: number;
};

/** `GET /v1/search`. One flat list; `kind` says where a hit links to. */
export type ApiSearchHit = {
  id: string;
  kind: 'project' | 'training_run' | 'deployment';
  name: string;
  /** The owning project; equals `id` for a project hit. */
  project_id: string;
};
