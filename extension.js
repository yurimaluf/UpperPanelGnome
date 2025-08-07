/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

// Inspired by the PainelNote48 app 'One Thing'
// Extension uses elements from 'Just Another Search Bar' (https://extensions.gnome.org/extension/5522/just-another-search-bar/)
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Mainloop from 'gi://Mainloop';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const MESSAGE_PATH = GLib.build_filenamev([GLib.get_user_config_dir(), "panelmsgTux", "message.txt"]);

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('Panel Note Dynamic'));

            this._label = new St.Label({
                text: "Carregando mensagem...",
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.add_child(this._label);

            this._timeoutId = null;
            this._startUpdating();
        }

        _startUpdating() {
            // Função para ler o arquivo e atualizar o texto
            const updateMessage = () => {
                try {
                    let [ok, contents] = GLib.file_get_contents(MESSAGE_PATH);
                    if (ok && contents) {
                        let message = contents.toString().trim();
                        if (message === "") {
                            message = "Nenhuma mensagem.";
                        }
                        this._label.set_text(message);
                    } else {
                        this._label.set_text("Arquivo de mensagem não encontrado.");
                    }
                } catch (e) {
                    log("Erro ao ler arquivo de mensagem: " + e);
                    this._label.set_text("Erro na leitura da mensagem.");
                }
                // Repete a cada 5 segundos
                return true;
            };

            // Executa imediatamente e agenda repetição periódica
            updateMessage();
            this._timeoutId = Mainloop.timeout_add_seconds(5, updateMessage);
        }

        _stopUpdating() {
            if (this._timeoutId) {
                Mainloop.source_remove(this._timeoutId);
                this._timeoutId = null;
            }
        }

        destroy() {
            this._stopUpdating();
            super.destroy();
        }
    }
);

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

