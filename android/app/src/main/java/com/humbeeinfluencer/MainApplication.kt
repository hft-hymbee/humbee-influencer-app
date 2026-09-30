package com.humbeeinfluencer

import android.app.Application
import android.os.Handler
import android.os.Looper
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.google.android.gms.maps.MapsInitializer

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    warmUpMaps()
  }

  /**
   * The first MapView in a process pays for loading the Google Maps renderer from Play services
   * — on an entry-level phone that is seconds of blank grey under the site picker's pin. Doing
   * it here, once, means the picker opens onto a map that is already able to draw.
   *
   * DELAYED, not inline: the load runs on the main thread, and cold start is the one moment
   * that thread must not be spent on a screen the user may never open.
   */
  private fun warmUpMaps() {
    Handler(Looper.getMainLooper()).postDelayed({
      runCatching { MapsInitializer.initialize(applicationContext, MapsInitializer.Renderer.LATEST) {} }
    }, MAPS_WARM_UP_DELAY_MS)
  }

  private companion object {
    const val MAPS_WARM_UP_DELAY_MS = 2_000L
  }
}
