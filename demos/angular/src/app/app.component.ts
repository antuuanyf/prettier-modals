import { Component, inject } from '@angular/core'
import {
  PrettyModalDirective,
  PrettyModalTriggerDirective,
  PrettyModalCloseDirective,
  PrettyModalService,
} from 'prettier-modals-angular'

interface Project {
  id: number
  name: string
  icon: string
  members: number
  status: 'live' | 'draft'
}

/**
 * "Nimbus" — a small dashboard that shows Pretty Modal in realistic situations
 * instead of bare demo buttons. Each scenario leans on a different part of the
 * API:
 *
 *  • Topbar bell / avatar → `anchor="origin"` + `originGap` ⇒ dropdown popovers
 *    that morph out of their round trigger and sit just below it.
 *  • "New project" → `anchor="origin"` with `originGap=10`
 *  • "Delete" / "See plans" → `anchor="center"` ⇒ classic centered dialogs, with
 *    a snappy `[duration]` override on the destructive confirm.
 *
 * The directives are used inline here (rather than wrapped in helper components)
 * so the template reads the way a real app would consume the library.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PrettyModalDirective, PrettyModalTriggerDirective, PrettyModalCloseDirective],
  template: `
    <div class="shell">
      <!-- ── Topbar ─────────────────────────────────────────────── -->
      <header class="topbar">
        <div class="brand"><span class="dot"></span> Nimbus</div>

        <div class="topbar-actions">
          <!-- Popover dropdown: morphs from the bell, dropped 12px below it. -->
          <button
            class="icon-btn"
            [prettyModalTrigger]="'notifications'"
            anchor="origin"
            [originGap]="10"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span class="badge">3</span>
          </button>

          <!-- Same pattern from a circular avatar → account menu. -->
          <button
            class="avatar-btn"
            [prettyModalTrigger]="'account'"
            anchor="origin"
            [originGap]="10"
            aria-label="Account"
          >
            AM
          </button>
        </div>
      </header>

      <!-- ── Page header ────────────────────────────────────────── -->
      <div class="page-head">
        <div>
          <h1>Projects</h1>
          <p>{{ projects.length }} workspaces · last synced just now</p>
        </div>

        <!-- originGap=10 ⇒ the button morphs *into* the modal (and back). -->
        <button
          class="btn btn-primary"
          [prettyModalTrigger]="'new-project'"
          anchor="origin"
          [originGap]="10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New project
        </button>
      </div>

      <!-- ── Project grid ───────────────────────────────────────── -->
      <div class="grid">
        @for (p of projects; track p.id) {
          <div class="card">
            <div class="card-top">
              <div class="card-icon">{{ p.icon }}</div>
              <div>
                <h3>{{ p.name }}</h3>
                <p class="meta">{{ p.members }} members</p>
              </div>
            </div>
            <div class="card-footer">
              <span class="tag" [class.live]="p.status === 'live'">
                {{ p.status === 'live' ? '● Live' : 'Draft' }}
              </span>
              <!-- Centered confirm dialog. The (click) sets context first, then
                   the trigger directive opens the shared dialog. -->
              <button
                class="btn btn-ghost"
                [prettyModalTrigger]="'confirm-delete'"
                anchor="center"
                (click)="selected = p"
              >
                Delete
              </button>
            </div>
          </div>
        }
      </div>

      <!-- ── Upgrade banner ─────────────────────────────────────── -->
      <div class="banner">
        <div>
          <h3>You're on the Free plan</h3>
          <p>Unlock unlimited projects, audit logs and priority support.</p>
        </div>
        <button class="btn" [prettyModalTrigger]="'pricing'" anchor="center">See plans</button>
      </div>
    </div>

    <!-- ─────────────────────────── Dialogs ─────────────────────────── -->

    <!-- Account menu (popover). Light-dismiss on backdrop click via the service. -->
    <dialog
      id="account"
      class="popover"
      prettyModal
      anchor="origin"
      (click)="dismissOnBackdrop($event, 'account')"
      (opened)="log('opened', 'account')"
      (closed)="log('closed', 'account')"
    >
      <div class="menu">
        <div class="menu-head">
          <span class="avatar-btn">AM</span>
          <div>
            <div class="name">Antonio Monreal</div>
            <div class="email">antonio&#64;nimbus.app</div>
          </div>
        </div>
        <div class="menu-sep"></div>
        <button class="menu-item" prettyModalClose>👤 Profile</button>
        <button class="menu-item" prettyModalClose>⚙️ Settings</button>
        <button class="menu-item" prettyModalClose>💳 Billing</button>
        <div class="menu-sep"></div>
        <button class="menu-item danger" prettyModalClose>↩︎ Sign out</button>
      </div>
    </dialog>

    <!-- Notifications (popover). -->
    <dialog
      id="notifications"
      class="popover"
      prettyModal
      anchor="origin"
      (click)="dismissOnBackdrop($event, 'notifications')"
      (opened)="log('opened', 'notifications')"
      (closed)="log('closed', 'notifications')"
    >
      <div class="popover-head">
        Notifications
        <button class="btn btn-ghost" style="height:28px;padding:0 8px" prettyModalClose>Close</button>
      </div>
      <div class="notif">
        <div class="ico">🚀</div>
        <div class="body">
          <strong>Deploy succeeded</strong> on <strong>Orbit API</strong>
          <div class="t">2 min ago</div>
        </div>
      </div>
      <div class="notif">
        <div class="ico">💬</div>
        <div class="body">
          <strong>Lucía</strong> mentioned you in <strong>Design system</strong>
          <div class="t">1 hour ago</div>
        </div>
      </div>
      <div class="notif">
        <div class="ico">⚠️</div>
        <div class="body">
          Usage at <strong>80%</strong> of the Free plan limit
          <div class="t">Yesterday</div>
        </div>
      </div>
    </dialog>

    <!-- New project form — morphs out of the primary button (origin, gap 0). -->
    <dialog
      id="new-project"
      class="modal"
      prettyModal
      anchor="origin"
      (opened)="log('opened', 'new-project')"
      (closed)="log('closed', 'new-project')"
    >
      <div class="modal-head">
        <h2>Create a project</h2>
        <p>Spin up a fresh workspace for your team.</p>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Project name</label>
          <input type="text" placeholder="e.g. Aurora mobile" />
        </div>
        <div class="field">
          <label>Visibility</label>
          <select>
            <option>Private — only invited members</option>
            <option>Workspace — anyone in Nimbus</option>
          </select>
        </div>
        <div class="field">
          <label>Accent color</label>
          <div class="color-row">
            <span class="swatch" style="background:#4f46e5" data-active="true"></span>
            <span class="swatch" style="background:#059669"></span>
            <span class="swatch" style="background:#f59e0b"></span>
            <span class="swatch" style="background:#ef4444"></span>
            <span class="swatch" style="background:#0ea5e9"></span>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" prettyModalClose>Cancel</button>
        <button class="btn btn-primary" prettyModalClose>Create project</button>
      </div>
    </dialog>

    <!-- Destructive confirm — centered, with a faster close. -->
    <dialog
      id="confirm-delete"
      class="modal"
      style="max-width:420px"
      prettyModal
      anchor="center"
      (opened)="log('opened', 'confirm-delete')"
      (closed)="log('closed', 'confirm-delete')"
    >
      <div class="modal-head">
        <h2>Delete project?</h2>
        <p>
          <strong>{{ selected?.name || 'This project' }}</strong> and all its data will be
          permanently removed. This can't be undone.
        </p>
      </div>
      <div class="modal-foot">
        <button class="btn" prettyModalClose [duration]="0.3">Keep it</button>
        <button class="btn btn-danger" prettyModalClose [duration]="0.3" (click)="deleteSelected()">
          Delete
        </button>
      </div>
    </dialog>

    <!-- Pricing — wide centered modal. -->
    <dialog
      id="pricing"
      class="modal wide"
      prettyModal
      anchor="center"
      (opened)="log('opened', 'pricing')"
      (closed)="log('closed', 'pricing')"
    >
      <div class="modal-head">
        <h2>Choose your plan</h2>
        <p>Upgrade any time. Cancel any time.</p>
      </div>
      <div class="modal-body">
        <div class="plans">
          <div class="plan">
            <h4>Free</h4>
            <div class="price">$0<span>/mo</span></div>
            <ul>
              <li>3 projects</li>
              <li>Community support</li>
            </ul>
          </div>
          <div class="plan featured">
            <h4>Pro</h4>
            <div class="price">$12<span>/mo</span></div>
            <ul>
              <li>Unlimited projects</li>
              <li>Audit logs</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div class="plan">
            <h4>Team</h4>
            <div class="price">$29<span>/mo</span></div>
            <ul>
              <li>Everything in Pro</li>
              <li>SSO & SCIM</li>
              <li>SLA</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn" prettyModalClose>Maybe later</button>
        <button class="btn btn-primary" prettyModalClose>Upgrade to Pro</button>
      </div>
    </dialog>

    <p class="status">Último evento: {{ lastEvent || '—' }}</p>
  `,
})
export class AppComponent {
  private readonly modal = inject(PrettyModalService)

  selected: Project | null = null
  lastEvent = ''

  projects: Project[] = [
    { id: 1, name: 'Orbit API', icon: '🛰️', members: 6, status: 'live' },
    { id: 2, name: 'Design system', icon: '🎨', members: 4, status: 'live' },
    { id: 3, name: 'Aurora mobile', icon: '📱', members: 3, status: 'draft' },
    { id: 4, name: 'Billing rework', icon: '💳', members: 2, status: 'draft' },
  ]

  /** Close a popover when the click lands on the backdrop, not its content. */
  dismissOnBackdrop(event: MouseEvent, id: string): void {
    if (event.target === event.currentTarget) {
      this.modal.close(id, { onClose: () => this.log('closed', id) })
    }
  }

  deleteSelected(): void {
    if (!this.selected) return
    this.projects = this.projects.filter((p) => p.id !== this.selected!.id)
    this.selected = null
  }

  log(kind: 'opened' | 'closed', id: string): void {
    this.lastEvent = `${kind}: ${id}`
  }
}
